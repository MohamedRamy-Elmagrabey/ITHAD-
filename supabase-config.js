'use strict';

/* ============================================================
   supabase-config.js – الإعدادات المشتركة لـ Supabase
   ⚠️  استبدل القيم التالية بمشروعك من supabase.com
   ============================================================ */

const SUPABASE_URL = 'https://urdcfzuzfinupijaychj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZGNmenV6ZmludXBpamF5Y2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTUzNzAsImV4cCI6MjA5NTI5MTM3MH0.OFWfdXHp2ohHuL8AsFVZ82J7afK68vd_GOe5XSNevuw';

var supabaseClient = null;
var STORAGE_URL = 'https://urdcfzuzfinupijaychj.supabase.co/storage/v1/object/public/images/';

function initSupabase() {
  if (!supabaseClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/* ─── Default data fallback ─── */
var DEFAULT_COMMITTEES = [
  {id:'c1',name:'العلاقات العامة',icon:'fas fa-handshake',shortDesc:'بناء الشراكات والتواصل الخارجي وتمثيل الاتحاد',fullDesc:'هي اللجنة المسئولة عن اختيار أنسب الوسائل للتعامل الناجح المتبادل بين فرق الاتحاد وبعضها والوسائل المناسبة للتواصل مع الجمهور. مسئولة عن اكتساب سمعة إيجابية في المجتمع، ونقل صورة للأنشطة والخدمات التي يقدمها الاتحاد.'},
  {id:'c4',name:'الإعلام',icon:'fas fa-newspaper',shortDesc:'التغطية الإعلامية وإدارة المنصات الرقمية ونشر الأخبار',fullDesc:'التغطية الشاملة لأنشطة وفعاليات الاتحاد داخلياً وخارجياً. إنشاء وإدارة ومتابعة الأدوات الإعلامية من الموقع الإلكتروني إلى مواقع التواصل الاجتماعي المختلفة.'},
  {id:'c3',name:'الميديا',icon:'fas fa-camera',shortDesc:'التصاميم والمحتوى البصري والإنتاج الإعلامي الاحترافي',fullDesc:'تعمل على تصاميم وفقاً للمعايير وإعداد تصاميم مبتكرة بشكل احترافي وجدولة المهام المطلوبة والالتزام بالانتهاء منها في المواعيد المحددة.'},
  {id:'c10',name:'الموارد البشرية',icon:'fas fa-users-cog',shortDesc:'إدارة الأعضاء ورعايتهم وتطوير الكوادر البشرية للاتحاد',fullDesc:'تستخدم الموارد البشرية لوصف كل الأشخاص الذين يعملون في الاتحاد والقسم المسؤول عن إدارة جميع الأمور المتعلقة بالأعضاء.'},
  {id:'c8',name:'التنظيم',icon:'fas fa-sitemap',shortDesc:'تنظيم الفعاليات والمؤتمرات والإشراف على سير الأنشطة',fullDesc:'هم واجهة الفريق التي تتعامل مع الزوار. يفترض على أعضاء اللجنة التنظيمية الالتزام بزي محدد في الفعاليات والأسلوب الراقي والتعامل السليم مع الضغط.'},
  {id:'c7',name:'التدريب والتحول الرقمي',icon:'fas fa-microchip',shortDesc:'التدريب على التقنيات الحديثة والتحول الرقمي والابتكار',fullDesc:'التعريف بالتحول الرقمي وكيفية مواكبة التطور التكنولوجي والمساعدة على تطويره وتحويل الأفكار إلى منتجات مفيدة.'},
  {id:'c6',name:'الشباب والرياضة',icon:'fas fa-running',shortDesc:'دعم الأنشطة الرياضية واكتشاف المواهب الرياضية',fullDesc:'هي لجنة تعمل على دعم وتدريب الشباب في جميع الألعاب الرياضية وعمل مسابقات وبطولات لاكتشاف الموهوبين رياضياً.'},
  {id:'c5',name:'الشئون الصحية',icon:'fas fa-heartbeat',shortDesc:'الوعي الصحي والرعاية الصحية للأعضاء والمجتمع',fullDesc:'إعطاء محاضرات عن الإسعافات الأولية ووضع ملصقات إعلانية توعية صحية بالتعاون مع اللجنة الإعلامية ونشر الوعي الصحي وعمل أنشطة تطوعية داخل المدارس.'},
  {id:'c2',name:'التطوير والبحث العلمي',icon:'fas fa-flask',shortDesc:'البحث العلمي واكتشاف المواهب ودعم الطلاب المتميزين',fullDesc:'تعمل على تعريف شؤون البحث العلمي وعمل مسابقات علمية داخل المدارس لاكتشاف الموهوبين علمياً وعمل تدريبات لحث الطلاب على حب الدراسة وحب الوطن.'},
  {id:'c9',name:'الفنية',icon:'fas fa-palette',shortDesc:'الأنشطة الفنية والثقافية والإبداعية للأعضاء',fullDesc:'تعمل اللجنة الفنية على رعاية الموهوبين فنياً في الاتحاد وتنظيم الأنشطة الثقافية والفنية والإبداعية وتسعى لاكتشاف المواهب الفنية وتطويرها.'}
];

function mergeCommittees(supabaseData) {
  const sb = supabaseData || [];
  const defIds = new Set(DEFAULT_COMMITTEES.map(c => c.id));
  const merged = DEFAULT_COMMITTEES.map(dc => sb.find(sc => sc.id === dc.id) || dc);
  sb.forEach(sc => { if (!defIds.has(sc.id)) merged.push(sc); });
  return merged;
}

var DEFAULT_NEWS = [
  {id:'n1',title:'إطلاق اتحاد شباب الوطن – فرع الإسكندرية',desc:'تم الإعلان رسمياً عن تأسيس كيان اتحاد شباب الوطن بالإسكندرية ضمن مبادرة وزارة الشباب والرياضة.',date:'1 مايو 2026',img:'',imgPos:'center',pinned:false},
  {id:'n2',title:'انطلاق تشكيل اللجان المتخصصة للاتحاد',desc:'بدأ الاتحاد رسمياً في تشكيل لجانه الـ10 المتخصصة واستقبال المتقدمين للانضمام.',date:'15 مايو 2026',img:'',imgPos:'center',pinned:false},
  {id:'n3',title:'الاتحاد يستقبل طلبات الانضمام للأعضاء الجدد',desc:'فُتح باب التسجيل رسمياً للراغبين في الانضمام. تواصل معنا الآن وكن جزءاً من منظومة التغيير!',date:'20 مايو 2026',img:'',imgPos:'center',pinned:false}
];

/* ─── Helpers ─── */
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function arabicDate(d = new Date()) {
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(s || '')));
  return d.innerHTML;
}
function lsGet(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

/* ─── Upload image to Supabase Storage ─── */
async function uploadImage(fileName, dataUrl) {
  if (!supabaseClient) return dataUrl;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const path = fileName + '_' + Date.now() + '.jpg';
    const { error } = await supabaseClient.storage.from('images').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    return STORAGE_URL + path;
  } catch (e) {
    console.warn('Storage upload failed, using base64:', e);
    return dataUrl;
  }
}

/* ─── Resize image ─── */
function resizeImg(dataUrl, maxW, maxH, quality = 0.82) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxW || h > maxH) { const r = Math.min(maxW / w, maxH / h); w = Math.round(w * r); h = Math.round(h * r); }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      res(c.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}
