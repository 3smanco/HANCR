'use client';
import { useState } from 'react';
import { Car, Shield, Sparkles, Zap, MapPin, Phone, Smartphone, Star, Download, Check, ArrowDown } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <Navigation />
      <Hero />
      <DownloadSection />
      <Features />
      <ForRiders />
      <ForDrivers />
      <Stats />
      <Cities />
      <Contact />
      <Footer />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Navigation() {
  const links = [
    { label: 'المميزات', href: '#features' },
    { label: 'للراكبين', href: '#riders' },
    { label: 'للسائقين', href: '#drivers' },
    { label: 'المدن', href: '#cities' },
  ];
  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-lg bg-navy/80 border-b border-purple/30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-violet-deep flex items-center justify-center font-bold text-xl">H</div>
          <span className="font-bold text-xl">HANCR</span>
        </a>
        <div className="hidden md:flex gap-8 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-violet transition">{l.label}</a>
          ))}
        </div>
        <a href="#download" className="bg-violet hover:bg-violet-deep transition px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> حمِّل الآن
        </a>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="top" className="relative pt-32 pb-20 px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-violet/20 via-transparent to-cyan/10 pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet/20 rounded-full blur-[120px] animate-glow pointer-events-none" />

      <div className="relative max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet/10 border border-violet/30 text-sm mb-8">
          <Sparkles className="w-4 h-4 text-violet" />
          <span>إصدار MVP — جاهز للتجربة الآن</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          تنقَّل بذكاء.
          <br />
          <span className="bg-gradient-to-r from-violet via-cyan to-violet bg-clip-text text-transparent">
            وصِّل بأمان.
          </span>
        </h1>

        <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
          منصة التنقل الذكي الأولى في الخليج. رحلات، توصيل بضائع، ومشاركة سيارات — في تطبيق واحد آمن وسهل.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="#download" className="inline-flex items-center justify-center gap-2 bg-violet hover:bg-violet-deep transition px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet/30">
            <Download className="w-5 h-5" />
            حمِّل التطبيق
          </a>
          <a href="#features" className="inline-flex items-center justify-center gap-2 border-2 border-purple hover:border-violet hover:bg-violet/10 transition px-8 py-4 rounded-xl font-bold text-lg">
            <ArrowDown className="w-5 h-5" />
            اعرف المزيد
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-muted text-sm">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-cyan" /> طوارئ مدمجة</div>
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-cyan" /> نظام مكافآت</div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan" /> أسعار شفافة</div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function DownloadSection() {
  return (
    <section id="download" className="py-20 px-6 bg-gradient-to-br from-violet/30 via-purple/20 to-cyan/20 border-y border-violet/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">📱 حمِّل التطبيق الآن</h2>
          <p className="text-xl text-muted">جاهز للأندرويد. iOS قريباً.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Rider App */}
          <div className="bg-navy/80 backdrop-blur border-2 border-violet/40 rounded-2xl p-8 hover:border-violet transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet to-violet-deep flex items-center justify-center shadow-lg shadow-violet/50">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">للراكبين</h3>
                <p className="text-muted text-sm">احجز رحلتك، اطلب توصيل</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted mb-6">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> حجز فوري في 3 ثوانٍ</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> تتبُّع حيّ للسائق</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> محفظة آمنة</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> زر طوارئ مدمج</li>
            </ul>
            <a
              href="/downloads/hancr-rider.apk"
              download
              className="w-full bg-violet hover:bg-violet-deep transition py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-violet/30"
            >
              <Download className="w-5 h-5" />
              تحميل APK (114 MB)
            </a>
            <p className="text-xs text-muted text-center mt-3">Android 7+ • مجاني</p>
          </div>

          {/* Driver App */}
          <div className="bg-navy/80 backdrop-blur border-2 border-cyan/40 rounded-2xl p-8 hover:border-cyan transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan/80 to-cyan flex items-center justify-center shadow-lg shadow-cyan/50">
                <Car className="w-8 h-8 text-navy" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">للسائقين</h3>
                <p className="text-muted text-sm">قُد، اربح، تحكَّم</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted mb-6">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> عمولات 15% فقط</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> سحب فوري للأرباح</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> طلبات قريبة</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan" /> برنامج Stars</li>
            </ul>
            <a
              href="/downloads/hancr-driver.apk"
              download
              className="w-full bg-cyan hover:bg-cyan/80 text-navy transition py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan/30"
            >
              <Download className="w-5 h-5" />
              تحميل APK (114 MB)
            </a>
            <p className="text-xs text-muted text-center mt-3">Android 7+ • مجاني</p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-10 max-w-3xl mx-auto bg-navy/60 border border-purple/30 rounded-2xl p-6">
          <p className="font-bold text-center mb-4 text-cyan">🔑 بيانات الدخول التجريبية</p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-navy/80 rounded-xl p-4 text-center">
              <p className="text-muted mb-1">راكب تجريبي</p>
              <p className="font-mono text-violet text-lg">+966500000001</p>
              <p className="text-xs text-muted mt-1">OTP: <span className="font-mono text-cyan font-bold">1234</span></p>
            </div>
            <div className="bg-navy/80 rounded-xl p-4 text-center">
              <p className="text-muted mb-1">سائق تجريبي</p>
              <p className="font-mono text-cyan text-lg">+966500000010</p>
              <p className="text-xs text-muted mt-1">OTP: <span className="font-mono text-cyan font-bold">1234</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: Shield, title: 'نظام طوارئ متطور', desc: 'زر SOS مدمج يُرسل موقعك لجهات الطوارئ المسجَّلة فوراً + إشعار فريق HANCR.' },
    { icon: Zap, title: 'مطابقة فورية', desc: 'محرك ذكي يربطك بأقرب سائق في ثوانٍ — أسرع 73% من الأنظمة التقليدية.' },
    { icon: Sparkles, title: 'وضع المزايدة', desc: 'تنافس السائقون لتقديم أفضل سعر — أنت تختار الأنسب لك.' },
    { icon: Star, title: 'برنامج HANCR Miles', desc: '4 مستويات (Bronze إلى Platinum). كلما زادت رحلاتك زادت مكافآتك.' },
    { icon: MapPin, title: 'تتبُّع حيّ', desc: 'شارك مسار رحلتك مع جهاتك الموثوقة تلقائياً.' },
    { icon: Phone, title: 'دعم 24/7', desc: 'فريق دعم متاح طوال الوقت — بالعربية والإنجليزية.' },
  ];

  return (
    <section id="features" className="py-24 px-6 bg-purple/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">لماذا HANCR؟</h2>
          <p className="text-muted text-lg">صُمِّمت لتُلبّي احتياجات الخليج، بمعايير عالمية.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-navy/50 backdrop-blur border border-purple/30 rounded-2xl p-6 hover:border-violet/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-violet/20 flex items-center justify-center mb-4 group-hover:bg-violet/30 transition">
                <f.icon className="w-6 h-6 text-violet" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function ForRiders() {
  return (
    <section id="riders" className="py-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-block px-4 py-1 rounded-full bg-cyan/20 text-cyan text-sm font-semibold mb-4">للراكبين</div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">رحلتك. شروطك. أمانك.</h2>
          <ul className="space-y-4 text-lg">
            {['اطلب سيارة في 3 ثوانٍ', 'ادفع نقداً، بالمحفظة، أو بأي بوابة دفع', 'اطّلع على بيانات السائق + لوحة السيارة قبل الركوب', 'شارك رحلتك تلقائياً مع جهات الطوارئ', 'اربح نقاط ولاء على كل رحلة'].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet flex items-center justify-center mt-1 shrink-0 text-sm">✓</div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a href="/downloads/hancr-rider.apk" download className="mt-8 inline-flex items-center gap-2 bg-violet hover:bg-violet-deep transition px-8 py-4 rounded-xl font-bold">
            <Download className="w-5 h-5" /> حمِّل تطبيق الراكب
          </a>
        </div>
        <div className="bg-gradient-to-br from-violet/20 to-cyan/10 rounded-3xl p-12 text-center border border-violet/30">
          <Smartphone className="w-32 h-32 mx-auto mb-6 text-violet animate-float" />
          <h3 className="text-2xl font-bold mb-4">تطبيق الراكب</h3>
          <p className="text-muted mb-2">متوفر الآن على Android</p>
          <p className="text-xs text-muted">iOS قريباً</p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function ForDrivers() {
  return (
    <section id="drivers" className="py-24 px-6 bg-purple/10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="md:order-2">
          <div className="inline-block px-4 py-1 rounded-full bg-violet/20 text-violet text-sm font-semibold mb-4">للسائقين</div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">قُد بحُريَّة. اربح بثقة.</h2>
          <ul className="space-y-4 text-lg">
            {['عمولات أقل من المنافسين (15% فقط)', 'سحب أرباحك في أي وقت', 'لا اشتراك شهري ولا رسوم خفية', 'زر طوارئ في حالات الخطر', 'برنامج Stars: مكافآت إضافية لأفضل السائقين'].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan flex items-center justify-center mt-1 shrink-0 text-navy text-sm">✓</div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a href="/downloads/hancr-driver.apk" download className="mt-8 inline-flex items-center gap-2 bg-cyan text-navy hover:bg-cyan/80 transition px-8 py-4 rounded-xl font-bold">
            <Download className="w-5 h-5" /> حمِّل تطبيق السائق
          </a>
        </div>
        <div className="bg-gradient-to-br from-cyan/10 to-violet/20 rounded-3xl p-12 text-center border border-cyan/30">
          <Car className="w-32 h-32 mx-auto mb-6 text-cyan animate-float" />
          <h3 className="text-2xl font-bold mb-2">تطبيق السائق</h3>
          <p className="text-muted">إدارة كاملة لرحلاتك وأرباحك</p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: '3 ث', label: 'متوسط وقت المطابقة' },
    { value: '15%', label: 'العمولة فقط' },
    { value: '24/7', label: 'دعم مستمر' },
    { value: '5★', label: 'هدف رضا العملاء' },
  ];
  return (
    <section className="py-20 px-6 border-y border-purple/30">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet to-cyan bg-clip-text text-transparent mb-2">{s.value}</div>
            <div className="text-muted text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Cities() {
  const cities = [
    { name: 'الرياض', country: 'السعودية', status: 'متوفر' },
    { name: 'جدة', country: 'السعودية', status: 'قريباً' },
    { name: 'الدوحة', country: 'قطر', status: 'قريباً' },
    { name: 'دبي', country: 'الإمارات', status: 'قريباً' },
  ];
  return (
    <section id="cities" className="py-24 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">المدن المُغطَّاة</h2>
        <p className="text-muted text-lg mb-12">نتوسَّع لخدمتك أينما كنت</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cities.map((c) => (
            <div key={c.name} className="bg-navy/50 border border-purple/30 rounded-2xl p-6 hover:border-violet/50 transition">
              <MapPin className="w-8 h-8 text-violet mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-1">{c.name}</h3>
              <p className="text-muted text-sm mb-2">{c.country}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${c.status === 'متوفر' ? 'bg-cyan/20 text-cyan' : 'bg-violet/20 text-violet'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Contact() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="py-24 px-6 bg-gradient-to-br from-violet/30 via-purple/20 to-cyan/20">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-6">تواصل معنا</h2>
        <p className="text-xl text-muted mb-10">عندنا أسئلة؟ نسعد بمساعدتك</p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <a href="mailto:hello@hancr.com" className="bg-navy/60 border border-purple/30 rounded-2xl p-6 hover:border-violet/50 transition">
            <p className="text-muted text-sm mb-1">للاستفسارات العامة</p>
            <p className="font-bold text-violet">hello@hancr.com</p>
          </a>
          <a href="mailto:drivers@hancr.com" className="bg-navy/60 border border-cyan/30 rounded-2xl p-6 hover:border-cyan transition">
            <p className="text-muted text-sm mb-1">للسائقين الراغبين بالانضمام</p>
            <p className="font-bold text-cyan">drivers@hancr.com</p>
          </a>
          <a href="mailto:support@hancr.com" className="bg-navy/60 border border-purple/30 rounded-2xl p-6 hover:border-violet/50 transition">
            <p className="text-muted text-sm mb-1">دعم فني</p>
            <p className="font-bold text-violet">support@hancr.com</p>
          </a>
        </div>

        <form
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          onSubmit={(e) => { e.preventDefault(); setSent(true); window.location.href = `mailto:hello@hancr.com?subject=طلب اشتراك في HANCR&body=بريدي: ${email}`; }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="بريدك الإلكتروني للتواصل"
            required
            className="flex-1 px-6 py-4 rounded-xl bg-navy border-2 border-purple/50 focus:border-violet outline-none text-lg text-white"
          />
          <button type="submit" className="bg-violet hover:bg-violet-deep transition px-8 py-4 rounded-xl font-bold text-lg">
            {sent ? '✓ تم!' : 'تواصل معنا'}
          </button>
        </form>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-purple/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-violet-deep flex items-center justify-center font-bold text-xl">H</div>
              <span className="font-bold text-xl">HANCR</span>
            </div>
            <p className="text-muted leading-relaxed max-w-md">
              منصة التنقل الذكي الأولى في الخليج. صُنعت بشغف لخدمة المنطقة العربية.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-muted">
              <li><a href="#features" className="hover:text-violet transition">المميزات</a></li>
              <li><a href="#riders" className="hover:text-violet transition">للراكبين</a></li>
              <li><a href="#drivers" className="hover:text-violet transition">للسائقين</a></li>
              <li><a href="#cities" className="hover:text-violet transition">المدن</a></li>
              <li><a href="#download" className="hover:text-violet transition">تحميل التطبيق</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">تواصل معنا</h4>
            <ul className="space-y-2 text-muted">
              <li><a href="mailto:hello@hancr.com" className="hover:text-violet transition">hello@hancr.com</a></li>
              <li><a href="mailto:drivers@hancr.com" className="hover:text-violet transition">drivers@hancr.com</a></li>
              <li><a href="mailto:support@hancr.com" className="hover:text-violet transition">support@hancr.com</a></li>
              <li><a href="https://admin.hancr.com" className="hover:text-violet transition">لوحة الإدارة</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-purple/30 flex flex-col md:flex-row justify-between items-center gap-4 text-muted text-sm">
          <p>© 2026 HANCR. كل الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <a href="#contact" className="hover:text-violet transition">تواصل معنا</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
