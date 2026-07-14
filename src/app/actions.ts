'use server';

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export async function createClient(data: { name: string; phone?: string; address?: string }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO clients (name, phone, address)
      VALUES (?, ?, ?)
    `);
    stmt.run(data.name, data.phone || null, data.address || null);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  revalidatePath('/clients');
  redirect('/clients');
}

export async function addPayment(clientId: number, amount: number, notes: string | null) {
  try {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من الصفر');

    db.transaction(() => {
      db.prepare('INSERT INTO payments (client_id, amount, notes) VALUES (?, ?, ?)').run(clientId, amount, notes);
      db.prepare('UPDATE clients SET total_debt = total_debt - ? WHERE id = ?').run(amount, clientId);
    })();

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addDebt(clientId: number, amount: number, notes: string | null) {
  try {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من الصفر');

    db.transaction(() => {
      db.prepare('INSERT INTO payments (client_id, amount, notes) VALUES (?, ?, ?)').run(clientId, -amount, notes);
      db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?').run(amount, clientId);
    })();

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addOrderPayment(clientId: number, orderId: number, amount: number, notes: string | null) {
  try {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من الصفر');

    db.transaction(() => {
      // Check remaining debt for this order
      const allOrderPayments = db.prepare('SELECT amount FROM payments WHERE order_id = ?').all(orderId) as { amount: number }[];
      const sumOrderPayments = allOrderPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingDebt = Math.abs(sumOrderPayments);
      
      if (amount <= remainingDebt) {
        db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)').run(clientId, orderId, amount, notes);
        db.prepare('UPDATE clients SET total_debt = total_debt - ? WHERE id = ?').run(amount, clientId);
      } else {
        throw new Error('المبلغ المدفوع يتجاوز الدين المتبقي للطلب.');
      }
    })();

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateOrderNextStatus(orderId: number) {
  try {
    let nextStatus = 'pending';
    let clientId: number | null = null;
    
    db.transaction(() => {
      const order = db.prepare('SELECT client_id, total_amount, paid_amount, status FROM orders WHERE id = ?').get(orderId) as { client_id: number | null; total_amount: number; paid_amount: number; status: string } | undefined;
      if (!order) throw new Error('الطلب غير موجود');
      
      clientId = order.client_id;

      if (order.status === 'pending') nextStatus = 'processing';
      else if (order.status === 'processing') nextStatus = 'completed';
      else if (order.status === 'completed') nextStatus = 'delivered';
      
      if (order.status !== nextStatus) {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(nextStatus, orderId);
        
        if (nextStatus === 'delivered') {
          const debt = order.total_amount - order.paid_amount;
          if (debt > 0 && order.client_id) {
            db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?').run(debt, order.client_id);
            db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)').run(order.client_id, orderId, -debt, 'تسجيل دين الطلب');
          }
        }
      }
    })();

    if (clientId) {
      revalidatePath(`/clients/${clientId}`);
    }
    revalidatePath('/orders');
    return { success: true, nextStatus };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function editProduct(
  productId: number,
  data: {
    name: string;
    reference: string;
    type_id: number | null;
    purchase_price: number;
    selling_price: number;
    specifications: Record<string, string>;
  }
) {
  try {
    db.prepare(`
      UPDATE products 
      SET type_id = ?, name = ?, reference = ?, purchase_price = ?, selling_price = ?, specifications = ?
      WHERE id = ?
    `).run(
      data.type_id,
      data.name,
      data.reference,
      data.purchase_price,
      data.selling_price,
      JSON.stringify(data.specifications),
      productId
    );
    
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProduct(productId: number) {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    
    revalidatePath('/products');
  } catch (err: any) {
    if (err.message.includes('FOREIGN KEY') || err.message.includes('foreign key')) {
      return {
        success: false,
        error: 'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات مسجلة في النظام. يُفضل تغيير المخزون إلى 0 بدلاً من حذفه لتفادي أي مشاكل في سجلات الطلبات.'
      };
    }
    return { success: false, error: err.message };
  }

  redirect('/products');
}

export async function createOrder(formData: FormData) {
  try {
    const client_id_raw = formData.get('client_id');
    const new_client_name = formData.get('new_client_name') as string | null;
    const new_client_phone = formData.get('new_client_phone') as string | null;
    const new_client_address = formData.get('new_client_address') as string | null;
    
    const itemsJson = formData.get('items') as string;
    const items = itemsJson ? JSON.parse(itemsJson) : [];
    const paid_amount = Number(formData.get('paid_amount')) || 0;
    const status = (formData.get('status') as string) || 'pending';
    const notes = (formData.get('notes') as string) || '';
    
    const files = formData.getAll('file') as File[];
    
    const fileUrls: string[] = [];
    let source = 'manual';

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of files) {
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        fileUrls.push(`/uploads/${fileName}`);
        
        if (file.type.includes('pdf')) source = 'pdf';
        else if (source !== 'pdf') source = 'image';
      }
    }
    
    const fileUrl = fileUrls.length > 0 ? JSON.stringify(fileUrls) : null;

    let total_amount = 0;
    items.forEach((item: any) => {
      total_amount += item.quantity * item.unit_price;
    });

    db.transaction(() => {
      let final_client_id = client_id_raw ? Number(client_id_raw) : null;
      
      if (!final_client_id && new_client_name) {
        const stmtClient = db.prepare('INSERT INTO clients (name, phone, address) VALUES (?, ?, ?)');
        const infoClient = stmtClient.run(new_client_name, new_client_phone || null, new_client_address || null);
        final_client_id = infoClient.lastInsertRowid as number;
      }
      
      if (!final_client_id) {
         throw new Error('يرجى اختيار زبون أو إضافة زبون جديد.');
      }

      const stmtOrder = db.prepare(`
        INSERT INTO orders (client_id, total_amount, paid_amount, source, file_url, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmtOrder.run(final_client_id, total_amount, paid_amount, source, fileUrl, status, notes);
      const order_id = info.lastInsertRowid as number;

      const stmtItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, description, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        stmtItem.run(order_id, item.product_id || null, item.description, item.quantity, item.unit_price, itemTotal);
      }

      // Calculate debt ONLY if status is 'delivered'
      if (status === 'delivered') {
        const debt = total_amount - paid_amount;
        if (debt > 0) {
          db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?').run(debt, final_client_id);
          db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)').run(final_client_id, order_id, -debt, 'تسجيل دين الطلب');
        }
      }
    })();

    revalidatePath('/orders');
    revalidatePath('/clients');
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  redirect('/orders');
}

export async function editOrder(orderId: number, data: {
  status: string;
  paid_amount: number;
  notes: string;
  items: any[];
}) {
  try {
    const { status, paid_amount, notes, items } = data;
    
    let new_total_amount = 0;
    items.forEach(item => {
      new_total_amount += item.quantity * item.unit_price;
    });

    db.transaction(() => {
      // 1. Get old order details
      const oldOrder = db.prepare('SELECT client_id, total_amount, paid_amount, status FROM orders WHERE id = ?').get(orderId) as { client_id: number | null; total_amount: number; paid_amount: number; status: string } | undefined;
      if (!oldOrder) throw new Error('الطلب غير موجود');
      
      const old_debt_contribution = oldOrder.status === 'delivered' ? (oldOrder.total_amount - oldOrder.paid_amount) : 0;
      const new_debt_contribution = status === 'delivered' ? (new_total_amount - paid_amount) : 0;
      const debt_diff = new_debt_contribution - old_debt_contribution;

      // 2. Update order items (delete old, insert new)
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
      
      const stmtItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, description, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        stmtItem.run(orderId, item.product_id || null, item.description, item.quantity, item.unit_price, itemTotal);
      }

      // 3. Update the order itself
      db.prepare(`
        UPDATE orders 
        SET total_amount = ?, paid_amount = ?, status = ?, notes = ?
        WHERE id = ?
      `).run(new_total_amount, paid_amount, status, notes, orderId);

      // 4. Update client's total debt and the debt record in payments table
      if (oldOrder.client_id) {
        if (debt_diff !== 0) {
          db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?').run(debt_diff, oldOrder.client_id);
        }
        
        // Handle the debt record in payments table
        const existingDebtPayment = db.prepare("SELECT id FROM payments WHERE order_id = ? AND amount < 0 AND notes = 'تسجيل دين الطلب'").get(orderId) as { id: number } | undefined;
        
        if (status === 'delivered') {
          if (new_debt_contribution > 0) {
            if (existingDebtPayment) {
              db.prepare('UPDATE payments SET amount = ? WHERE id = ?').run(-new_debt_contribution, existingDebtPayment.id);
            } else {
              db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)').run(oldOrder.client_id, orderId, -new_debt_contribution, 'تسجيل دين الطلب');
            }
          } else {
            if (existingDebtPayment) {
              db.prepare('DELETE FROM payments WHERE id = ?').run(existingDebtPayment.id);
            }
          }
        } else {
          if (existingDebtPayment) {
            db.prepare('DELETE FROM payments WHERE id = ?').run(existingDebtPayment.id);
          }
        }
      }
    })();

    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createSchool(data: { name: string; address?: string; contact?: string; notes?: string }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO schools (name, address, contact, notes)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(data.name, data.address || null, data.contact || null, data.notes || null);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  revalidatePath('/schools');
  redirect('/schools');
}

export async function addSchoolList(formData: FormData) {
  try {
    const schoolIdRaw = formData.get('school_id');
    const schoolId = schoolIdRaw ? Number(schoolIdRaw) : null;
    const level_name = formData.get('level_name') as string;
    const file = formData.get('file') as File | null;
    
    if (!schoolId || !level_name) {
      throw new Error('المدرسة والمستوى الدراسي حقول مطلوبة');
    }

    let fileUrl = null;

    if (file && file.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `list_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      fileUrl = `/uploads/${fileName}`;
    }

    db.prepare(`
      INSERT INTO school_lists (school_id, level_name, file_url)
      VALUES (?, ?, ?)
    `).run(schoolId, level_name, fileUrl);

    revalidatePath(`/schools/${schoolId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createSupplierList(name: string) {
  try {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('اسم القائمة لا يمكن أن يكون فارغاً');
    
    const stmt = db.prepare('INSERT INTO supplier_lists (name) VALUES (?)');
    const result = stmt.run(cleanName);
    
    revalidatePath('/supplier-requests');
    return { success: true, listId: result.lastInsertRowid };
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return { success: false, error: 'توجد قائمة أخرى تحمل هذا الاسم بالفعل' };
    }
    return { success: false, error: err.message };
  }
}

export async function renameSupplierList(listId: number, newName: string) {
  try {
    const cleanName = newName.trim();
    if (!cleanName) throw new Error('اسم القائمة لا يمكن أن يكون فارغاً');

    db.prepare('UPDATE supplier_lists SET name = ? WHERE id = ?').run(cleanName, listId);
    
    revalidatePath('/supplier-requests');
    return { success: true };
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return { success: false, error: 'توجد قائمة أخرى تحمل هذا الاسم بالفعل' };
    }
    return { success: false, error: err.message };
  }
}

export async function deleteSupplierList(listId: number) {
  try {
    db.prepare('DELETE FROM supplier_lists WHERE id = ?').run(listId);
    
    revalidatePath('/supplier-requests');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addProductToSupplierList(listId: number, productId: number, quantity: number, note: string | null) {
  try {
    if (quantity <= 0) throw new Error('الكمية المطلوبة يجب أن تكون أكبر من الصفر');

    db.prepare(`
      INSERT INTO supplier_list_items (list_id, product_id, quantity, note)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(list_id, product_id) DO UPDATE SET
        quantity = quantity + excluded.quantity,
        note = CASE WHEN excluded.note IS NOT NULL AND excluded.note != '' THEN excluded.note ELSE note END
    `).run(listId, productId, quantity, note || null);

    revalidatePath('/supplier-requests');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProductInSupplierList(listId: number, productId: number, quantity: number, note: string | null) {
  try {
    if (quantity <= 0) throw new Error('الكمية المطلوبة يجب أن تكون أكبر من الصفر');

    db.prepare(`
      UPDATE supplier_list_items 
      SET quantity = ?, note = ?
      WHERE list_id = ? AND product_id = ?
    `).run(quantity, note || null, listId, productId);

    revalidatePath('/supplier-requests');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeProductFromSupplierList(listId: number, productId: number) {
  try {
    db.prepare('DELETE FROM supplier_list_items WHERE list_id = ? AND product_id = ?').run(listId, productId);
    
    revalidatePath('/supplier-requests');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

