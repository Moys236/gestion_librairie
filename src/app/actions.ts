'use server';

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createClient(data: { name: string; phone?: string; address?: string }) {
  try {
    await db.prepare(`
      INSERT INTO clients (name, phone, address)
      VALUES (?, ?, ?)
    `).run(data.name, data.phone || null, data.address || null);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  revalidatePath('/clients');
  redirect('/clients');
}

export async function addPayment(clientId: number, amount: number, notes: string | null) {
  try {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من الصفر');

    const stmt1 = db.prepare('INSERT INTO payments (client_id, amount, notes) VALUES (?, ?, ?)');
    const stmt2 = db.prepare('UPDATE clients SET total_debt = total_debt - ? WHERE id = ?');
    
    await db.batch([
      stmt1.bind(clientId, amount, notes),
      stmt2.bind(amount, clientId)
    ]);

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addDebt(clientId: number, amount: number, notes: string | null) {
  try {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من الصفر');

    const stmt1 = db.prepare('INSERT INTO payments (client_id, amount, notes) VALUES (?, ?, ?)');
    const stmt2 = db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?');
    
    await db.batch([
      stmt1.bind(clientId, -amount, notes),
      stmt2.bind(amount, clientId)
    ]);

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addOrderPayment(clientId: number, orderId: number, amount: number, notes: string | null) {
  try {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من الصفر');

    // Check remaining debt for this order
    const allOrderPayments = await db.prepare('SELECT amount FROM payments WHERE order_id = ?').all(orderId) as { amount: number }[];
    const sumOrderPayments = allOrderPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingDebt = Math.abs(sumOrderPayments);
    
    if (amount <= remainingDebt) {
      const stmt1 = db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)');
      const stmt2 = db.prepare('UPDATE clients SET total_debt = total_debt - ? WHERE id = ?');
      
      await db.batch([
        stmt1.bind(clientId, orderId, amount, notes),
        stmt2.bind(amount, clientId)
      ]);
    } else {
      throw new Error('المبلغ المدفوع يتجاوز الدين المتبقي للطلب.');
    }

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
    
    const order = await db.prepare('SELECT client_id, total_amount, paid_amount, status FROM orders WHERE id = ?').get(orderId) as { client_id: number | null; total_amount: number; paid_amount: number; status: string } | undefined;
    if (!order) throw new Error('الطلب غير موجود');
    
    clientId = order.client_id;

    if (order.status === 'pending') nextStatus = 'processing';
    else if (order.status === 'processing') nextStatus = 'completed';
    else if (order.status === 'completed') nextStatus = 'delivered';
    
    if (order.status !== nextStatus) {
      const statements = [
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(nextStatus, orderId)
      ];
      
      if (nextStatus === 'delivered') {
        const debt = order.total_amount - order.paid_amount;
        if (debt > 0 && order.client_id) {
          statements.push(
            db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?').bind(debt, order.client_id),
            db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)').bind(order.client_id, orderId, -debt, 'تسجيل دين الطلب')
          );
        }
      }
      
      await db.batch(statements);
    }

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
    await db.prepare(`
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
    await db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    
    revalidatePath('/products');
  } catch (err: any) {
    if (err.message.includes('FOREIGN KEY') || err.message.includes('foreign key')) {
      return {
        success: false,
        error: 'لا يمكن حذف هذا HTML المنتج لأنه مرتبط بطلبات مسجلة في النظام. يُفضل تغيير المخزون إلى 0 بدلاً من حذفه لتفادي أي مشاكل في سجلات الطلبات.'
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

    const isCloudflare = typeof process.env.DB !== 'undefined' || typeof (globalThis as any).WRANGLER_SYSTEM === 'object' || process.env.NODE_ENV === 'production';

    for (const file of files) {
      if (file && file.size > 0) {
        if (isCloudflare) {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          fileUrls.push(`data:${file.type};base64,${base64}`);
        } else {
          const fs = require('fs');
          const path = require('path');
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, buffer);
          fileUrls.push(`/uploads/${fileName}`);
        }
        
        if (file.type.includes('pdf')) source = 'pdf';
        else if (source !== 'pdf') source = 'image';
      }
    }
    
    const fileUrl = fileUrls.length > 0 ? JSON.stringify(fileUrls) : null;

    let total_amount = 0;
    items.forEach((item: any) => {
      total_amount += item.quantity * item.unit_price;
    });

    let final_client_id = client_id_raw ? Number(client_id_raw) : null;
    
    if (!final_client_id && new_client_name) {
      const infoClient = await db.prepare('INSERT INTO clients (name, phone, address) VALUES (?, ?, ?)').run(new_client_name, new_client_phone || null, new_client_address || null);
      final_client_id = infoClient.lastRowId || (infoClient as any).lastInsertRowid as number;
    }
    
    if (!final_client_id) {
       throw new Error('يرجى اختيار زبون أو إضافة زبون جديد.');
    }

    const info = await db.prepare(`
      INSERT INTO orders (client_id, total_amount, paid_amount, source, file_url, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(final_client_id, total_amount, paid_amount, source, fileUrl, status, notes);
    
    const order_id = info.lastRowId || (info as any).lastInsertRowid as number;

    const stmtItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, description, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const itemStatements = items.map((item: any) => {
      const itemTotal = item.quantity * item.unit_price;
      return stmtItem.bind(order_id, item.product_id || null, item.description, item.quantity, item.unit_price, itemTotal);
    });

    if (status === 'delivered') {
      const debt = total_amount - paid_amount;
      if (debt > 0) {
        itemStatements.push(
          db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?').bind(debt, final_client_id),
          db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)').bind(final_client_id, order_id, -debt, 'تسجيل دين الطلب')
        );
      }
    }

    if (itemStatements.length > 0) {
      await db.batch(itemStatements);
    }

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

    // 1. Get old order details
    const oldOrder = await db.prepare('SELECT client_id, total_amount, paid_amount, status FROM orders WHERE id = ?').get(orderId) as { client_id: number | null; total_amount: number; paid_amount: number; status: string } | undefined;
    if (!oldOrder) throw new Error('الطلب غير موجود');
    
    const old_debt_contribution = oldOrder.status === 'delivered' ? (oldOrder.total_amount - oldOrder.paid_amount) : 0;
    const new_debt_contribution = status === 'delivered' ? (new_total_amount - paid_amount) : 0;
    const debt_diff = new_debt_contribution - old_debt_contribution;

    const batchStatements: any[] = [
      db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(orderId)
    ];

    const stmtItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, description, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price;
      batchStatements.push(stmtItem.bind(orderId, item.product_id || null, item.description, item.quantity, item.unit_price, itemTotal));
    }

    batchStatements.push(
      db.prepare(`
        UPDATE orders 
        SET total_amount = ?, paid_amount = ?, status = ?, notes = ?
        WHERE id = ?
      `).bind(new_total_amount, paid_amount, status, notes, orderId)
    );

    if (oldOrder.client_id) {
      if (debt_diff !== 0) {
        batchStatements.push(db.prepare('UPDATE clients SET total_debt = total_debt + ? WHERE id = ?').bind(debt_diff, oldOrder.client_id));
      }
      
      const existingDebtPayment = await db.prepare("SELECT id FROM payments WHERE order_id = ? AND amount < 0 AND notes = 'تسجيل دين الطلب'").get(orderId) as { id: number } | undefined;
      
      if (status === 'delivered') {
        if (new_debt_contribution > 0) {
          if (existingDebtPayment) {
            batchStatements.push(db.prepare('UPDATE payments SET amount = ? WHERE id = ?').bind(-new_debt_contribution, existingDebtPayment.id));
          } else {
            batchStatements.push(db.prepare('INSERT INTO payments (client_id, order_id, amount, notes) VALUES (?, ?, ?, ?)').bind(oldOrder.client_id, orderId, -new_debt_contribution, 'تسجيل دين الطلب'));
          }
        } else {
          if (existingDebtPayment) {
            batchStatements.push(db.prepare('DELETE FROM payments WHERE id = ?').bind(existingDebtPayment.id));
          }
        }
      } else {
        if (existingDebtPayment) {
          batchStatements.push(db.prepare('DELETE FROM payments WHERE id = ?').bind(existingDebtPayment.id));
        }
      }
    }

    await db.batch(batchStatements);

    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createSchool(data: { name: string; address?: string; contact?: string; notes?: string }) {
  try {
    await db.prepare(`
      INSERT INTO schools (name, address, contact, notes)
      VALUES (?, ?, ?, ?)
    `).run(data.name, data.address || null, data.contact || null, data.notes || null);
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

    const isCloudflare = typeof process.env.DB !== 'undefined' || typeof (globalThis as any).WRANGLER_SYSTEM === 'object' || process.env.NODE_ENV === 'production';

    if (file && file.size > 0) {
      if (isCloudflare) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        fileUrl = `data:${file.type};base64,${base64}`;
      } else {
        const fs = require('fs');
        const path = require('path');
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
    }

    await db.prepare(`
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
    
    const result = await db.prepare('INSERT INTO supplier_lists (name) VALUES (?)').run(cleanName);
    const listId = result.lastRowId || (result as any).lastInsertRowid;
    
    revalidatePath('/supplier-requests');
    return { success: true, listId };
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

    await db.prepare('UPDATE supplier_lists SET name = ? WHERE id = ?').run(cleanName, listId);
    
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
    await db.prepare('DELETE FROM supplier_lists WHERE id = ?').run(listId);
    
    revalidatePath('/supplier-requests');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addProductToSupplierList(listId: number, productId: number, quantity: number, note: string | null) {
  try {
    if (quantity <= 0) throw new Error('الكمية المطلوبة يجب أن تكون أكبر من الصفر');

    await db.prepare(`
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

    await db.prepare(`
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
    await db.prepare('DELETE FROM supplier_list_items WHERE list_id = ? AND product_id = ?').run(listId, productId);
    
    revalidatePath('/supplier-requests');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
