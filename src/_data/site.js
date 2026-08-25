const routes = {
  home: { en: "/index.html", fr: "/fr/index.html", ar: "/ar/index.html" },
  about: { en: "/about.html", fr: "/fr/about.html", ar: "/ar/about.html" },
  services: { en: "/services.html", fr: "/fr/services.html", ar: "/ar/services.html" },
  contact: { en: "/contact.html", fr: "/fr/contact.html", ar: "/ar/contact.html" },
  notFound: { en: "/404.html" }
};

function localizedUrl(pageKey, locale) {
  const localizedRoutes = routes[pageKey];

  if (!localizedRoutes) throw new Error(`Unknown page key: ${pageKey}`);
  if (!localizedRoutes[locale]) throw new Error(`Unsupported locale "${locale}" for page key "${pageKey}"`);

  return localizedRoutes[locale];
}

const serviceAnchors = {
  en: ["family-medicine", "holistic-consultations", "quantum-scan", "naturopathy", "hijamah", "physiotherapy", "dermatology", "judiciary-medical-expertise", "weight-loss"],
  fr: ["medecine-familiale", "consultations-holistiques", "quantum-scan", "naturopathie", "hijamah", "physiotherapie", "dermatologie", "expertise-medicale-judiciaire", "perte-de-poids"],
  ar: ["family-medicine", "holistic-consultations", "quantum-scan", "naturopathy", "hijamah", "physiotherapy", "dermatology", "judiciary-medical-expertise", "weight-loss"]
};

const locales = {
  en: {
    clinicName: "Family Clinic",
    logoAlt: "Family Clinic Logo",
    homeAriaLabel: "Go to Family Clinic homepage",
    navigationAriaLabel: "Main navigation",
    languageSwitcherAriaLabel: "Choose language",
    mobileMenuAriaLabel: "Toggle mobile menu",
    navLabels: { home: "Home", about: "About", services: "Services", contact: "Contact" },
    skipToContent: "Skip to content",
    cta: { headerCall: "Call Us", heroCall: "Call to Book an Appointment" },
    footer: {
      description: "Providing comprehensive healthcare services for families in a welcoming and compassionate environment.",
      quickLinksHeading: "Quick Links", servicesHeading: "Services", contactHeading: "Contact Info",
      addressLabel: "Address:", phoneLabel: "Phone:", emailLabel: "Email:", hoursLabel: "Hours:",
      copyright: "Family Clinic. All rights reserved.", poweredBy: "Powered by", netriaLogoAlt: "Netria Logo"
    },
    contact: {
      title: "Contact Information", addressLabel: "Address", phoneLabel: "Phone", emailLabel: "Email", languagesLabel: "Languages", hoursLabel: "Opening Hours",
      addressLines: ["N*47, Bloc B, Ouled Oujih", "Kenitra, Morocco", "14080"], languages: "English, French, Arabic",
      hours: [{ day: "Monday - Thursday", time: ["9:00 - 17:00"] }, { day: "Friday", time: ["9:00 - 13:00", "15:00 - 18:00"] }, { day: "Saturday", time: ["9:00 - 13:00"] }, { day: "Sunday", time: ["Closed"] }],
      footerHours: ["Mon-Thu: 9:00 - 17:00", "Fri: 9:00 - 13:00, 15:00 - 18:00", "Sat: 9:00 - 13:00"]
    },
    services: ["Family Medicine", "Holistic Consultations", "Quantum Scan", "Naturopathy", "Hijamah", "Physiotherapy", "Dermatology & Surgery", "Judiciary Medical Expertise", "Weight Loss"]
  },
  fr: {
    clinicName: "Family Clinic",
    logoAlt: "Logo Family Clinic",
    homeAriaLabel: "Aller à la page d'accueil de Family Clinic",
    navigationAriaLabel: "Navigation principale",
    languageSwitcherAriaLabel: "Choisir la langue",
    mobileMenuAriaLabel: "Basculer le menu mobile",
    navLabels: { home: "Accueil", about: "À Propos", services: "Services", contact: "Contact" },
    skipToContent: "Aller au contenu",
    cta: { headerCall: "Appelez-nous", heroCall: "Appelez pour prendre rendez-vous" },
    footer: {
      description: "Offrir des services de santé complets aux familles dans un environnement accueillant et compatissant.",
      quickLinksHeading: "Liens rapides", servicesHeading: "Services", contactHeading: "Informations de contact",
      addressLabel: "Adresse :", phoneLabel: "Téléphone :", emailLabel: "Email :", hoursLabel: "Heures d'ouverture :",
      copyright: "Family Clinic. Tous droits réservés.", poweredBy: "Propulsé par", netriaLogoAlt: "Logo Netria"
    },
    contact: {
      title: "Informations de Contact", addressLabel: "Adresse", phoneLabel: "Téléphone", emailLabel: "Email", languagesLabel: "Langues", hoursLabel: "Horaires d'Ouverture",
      addressLines: ["N°47, Bloc B, Ouled Oujih", "Kenitra, Maroc", "14080"], languages: "Anglais, Français, Arabe",
      hours: [{ day: "Lundi - Jeudi", time: ["9:00 - 17:00"] }, { day: "Vendredi", time: ["9:00 - 13:00", "15:00 - 18:00"] }, { day: "Samedi", time: ["9:00 - 13:00"] }, { day: "Dimanche", time: ["Fermé"] }],
      footerHours: ["Lun-Jeu : 9:00 - 17:00", "Ven : 9:00 - 13:00, 15:00 - 18:00", "Sam : 9:00 - 13:00"]
    },
    services: ["Médecine de famille", "Consultations holistiques", "Quantum Scan", "Naturopathie", "Hijamah", "Physiothérapie", "Dermatologie & chirurgie", "Expertise médicale judiciaire", "Perte de poids"]
  },
  ar: {
    clinicName: "عيادة الأسرة",
    logoAlt: "شعار عيادة الأسرة",
    homeAriaLabel: "عيادة الأسرة - الصفحة الرئيسية",
    navigationAriaLabel: "التنقل الرئيسي",
    languageSwitcherAriaLabel: "اختر اللغة",
    mobileMenuAriaLabel: "تبديل القائمة المحمولة",
    navLabels: { home: "الرئيسية", about: "نبذة عنا", services: "الخدمات", contact: "اتصل بنا" },
    skipToContent: "الانتقال إلى المحتوى",
    cta: { headerCall: "اتصل بنا", heroCall: "اتصل لحجز موعد" },
    footer: {
      description: "رعاية صحية شاملة لعائلتك في بيئة ترحيبية ومهنية.",
      quickLinksHeading: "روابط سريعة", servicesHeading: "خدماتنا", contactHeading: "معلومات الاتصال",
      addressLabel: "العنوان:", phoneLabel: "الهاتف:", emailLabel: "البريد الإلكتروني:", hoursLabel: "ساعات العمل:",
      copyright: "عيادة الأسرة. جميع الحقوق محفوظة.", poweredBy: "مدعوم بواسطة", netriaLogoAlt: "شعار Netria"
    },
    contact: {
      title: "معلومات الاتصال", addressLabel: "العنوان", phoneLabel: "الهاتف", emailLabel: "البريد الإلكتروني", languagesLabel: "اللغات", hoursLabel: "ساعات العمل",
      addressLines: ["رقم 47، بلوك ب، أولاد أوجيه", "القنيطرة، المغرب", "14080"], languages: "العربية، الفرنسية، الإنجليزية",
      hours: [{ day: "الإثنين - الخميس", time: ["9:00 - 17:00"] }, { day: "الجمعة", time: ["9:00 - 13:00", "15:00 - 18:00"] }, { day: "السبت", time: ["9:00 - 13:00"] }, { day: "الأحد", time: ["مغلق"] }],
      footerHours: ["الاثنين-الخميس: 9:00 - 17:00", "الجمعة: 9:00 - 13:00، 15:00 - 18:00", "السبت: 9:00 - 13:00"]
    },
    services: ["طب الأسرة", "الاستشارات الشمولية", "المسح الكمي", "الطب الطبيعي", "الحجامة", "العلاج الطبيعي", "طب الأمراض الجلدية والجراحة التكاملية", "الخبرة الطبية القضائية", "تخسيس الوزن"]
  }
};

export default {
  url: "https://www.familyclinic.doctor",
  analyticsDomain: "familyclinic.doctor",
  ogImage: "/assets/images/optimized/clinic/clinic_entrance_desktop_800x400.jpg",
  ogLocales: { en: "en_US", fr: "fr_FR", ar: "ar_MA" },
  routes,
  localizedUrl,
  localeNames: { en: "English", fr: "Français", ar: "العربية" },
  navigation: [{ key: "home" }, { key: "about" }, { key: "services" }, { key: "contact" }],
  contact: { mapUrl: "https://maps.app.goo.gl/sPxKYDMUdsN9dVV2A", phone: "+212-641-745-441", email: "saidalaoui.m.a@gmail.com", latitude: "34.2611", longitude: "-6.5802", postalCode: "14080" },
  locales,
  serviceAnchors
};
