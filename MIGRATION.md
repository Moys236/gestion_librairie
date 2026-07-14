# دليل الهجرة من AstroJS إلى Next.js 16 (App Router)

يوثق هذا الدليل الهيكلية الجديدة للتطبيق ومطابقتها مع الكود الأصلي في AstroJS لضمان الصيانة المستقبلية السلسة.

## 1. مطابقة المسارات والصفحات (Routing Mapping)

| مسار AstroJS الأصلي | مسار Next.js الجديد (App Router) | المكونات الرئيسية | نوع الرندرة (Next.js) |
| :--- | :--- | :--- | :--- |
| `/` | `src/app/(dashboard)/page.tsx` | إحصائيات المخزون والتنبيهات | Server Component (Dynamic) |
| `/clients` | `src/app/(dashboard)/clients/page.tsx` | دليل الزبائن مع فلترة الترتيب والبحث | Server Component + `ClientsList` Client Component |
| `/clients/new` | `src/app/(dashboard)/clients/new/page.tsx` | نموذج إضافة زبون جديد | Client Component + `createClient` Server Action |
| `/clients/[id]` | `src/app/(dashboard)/clients/[id]/page.tsx` | تفاصيل الزبون والمدفوعات والمودال | Server Component + `ClientDetails` Client Component |
| `/products` | `src/app/(dashboard)/products/page.tsx` | دليل المنتجات واستيراد/تصدير إكسل | Server Component + `ProductsList` Client Component |
| `/products/new` | `src/app/(dashboard)/products/new/page.tsx` | إضافة منتج يدوي/كتالوج مع توليد رمز تلقائي | Server Component + `ProductForm` Client Component |
| `/products/[id]` | `src/app/(dashboard)/products/[id]/page.tsx` | تفاصيل منتج وتحديث مخزون وسجل حركات | Server Component + `ProductDetailsForm` Client Component |
| `/products/type/[id]` | `src/app/(dashboard)/products/type/[id]/page.tsx` | منتجات مفرزة بنوع محدد وتصدير إكسل | Server Component + `ProductsByType` Client Component |
| `/orders` | `src/app/(dashboard)/orders/page.tsx` | سجل الطلبات وحالة التجهيز والتسليم | Server Component + `OrdersList` Client Component |
| `/orders/new` | `src/app/(dashboard)/orders/new/page.tsx` | إنشاء طلب ثنائي اللوحة (إدخال ومرفقات) | Server Component + `NewOrderForm` Client Component |
| `/orders/[id]` | `src/app/(dashboard)/orders/[id]/page.tsx` | تعديل الطلب مع عرض المرفقات ثنائي اللوحة | Server Component + `EditOrderForm` Client Component |
| `/schools` | `src/app/(dashboard)/schools/page.tsx` | دليل المدارس وإحصاء اللوائح المرفقة | Server Component (Dynamic) |
| `/schools/new` | `src/app/(dashboard)/schools/new/page.tsx` | إضافة مدرسة جديدة | Client Component + `createSchool` Server Action |
| `/schools/[id]` | `src/app/(dashboard)/schools/[id]/page.tsx` | لوائح المؤسسة مع رفع اللوائح وعارض PDF | Server Component + `SchoolDetails` Client Component |

---

## 2. مطابقة الـ APIs (Route Handlers)

| مسار API AstroJS الأصلي | مسار Next.js Route Handler الجديد | المهام المدعومة |
| :--- | :--- | :--- |
| `/api/categories` | `src/app/api/categories/route.ts` | `GET` (قائمة الفئات), `POST` (إنشاء فئة) |
| `/api/categories/[id]` | `src/app/api/categories/[id]/route.ts` | `PUT` (تعديل فئة), `DELETE` (حذف فئة) |
| `/api/types` | `src/app/api/types/route.ts` | `GET` (قائمة الأنواع), `POST` (إنشاء نوع مع مواصفات) |
| `/api/types/[id]` | `src/app/api/types/[id]/route.ts` | `PUT` (تعديل نوع ومواصفات), `DELETE` (حذف نوع) |
| `/api/products` | `src/app/api/products/route.ts` | `GET` (جلب المنتجات), `POST` (إنشاء منتج مع مخزون أولي) |
| `/api/products/[id]` | `src/app/api/products/[id]/route.ts` | `DELETE` (حذف منتج مع مراعاة قيود المفاتيح الأجنبية) |
| `/api/products/[id]/stock` | `src/app/api/products/[id]/stock/route.ts` | `GET` (سجل الحركات مجزأ صفحات), `POST` (تسجيل حركة صادر/وارد) |
| `/api/products/import` | `src/app/api/products/import/route.ts` | `POST` (استيراد منتجات دفعة واحدة من إكسل) |

---

## 3. المكونات والطبقات الخدمية المشتركة (Shared Components & Services)

*   **الاتصال بقاعدة البيانات (`src/lib/db.ts`)**:
    تم نقل منطق الاتصال بـ SQLite باستخدام مكتبة `better-sqlite3`. تم تطبيق نمط Singleton (`globalForDb`) لتفادي تجاوز الحد الأقصى للاتصالات المتاحة أثناء التطوير والتحديث الساخن (Hot Reloading).
*   **منطق حركات المخزون المعاملاتية (`src/lib/stock.ts`)**:
    يقوم بإجراء عمليات إدخال وسحب وتعديل المخزون داخل معاملة (Transaction) واحدة لضمان دقة وسلامة البيانات.
*   **الإجراءات من جانب الخادم (`src/app/actions.ts`)**:
    يحتوي على كافة الـ React Server Actions المستدعاة مباشرة من المكونات التفاعلية:
    *   إضافة الزبائن ودفع ديون الطلبات المتكاملة.
    *   تدرج حالة الطلبات وتحديث ديون الزبائن.
    *   تعديل وحذف المنتجات.
    *   إضافة المدارس ورفع مستندات لوائح المدارس.
*   **نظام التنبيهات المنبثقة (`src/components/ToastInitializer.tsx`)**:
    يدمج واجهة برمجة التطبيقات المتوافقة القديمة (`window.showToast`) مع بيئة Next.js.
*   **تصدير واستيراد إكسل**:
    تستخدم المكونات (`ProductsList`, `ProductsByType`) تحميلًا كسلانًا لمكتبة SheetJS عبر مكوّن `next/script` لضمان سرعة التحميل الأولي للموقع.
