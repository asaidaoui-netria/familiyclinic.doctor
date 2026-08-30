/**
 * @typedef {{ title: string, summary: string, description: string }} LocalizedPublicationCopy
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   category: "nutrition"|"conditions"|"pregnancy"|"environment",
 *   author: "Dr. Said-Alaoui Moulay Abdellah",
 *   editions: { en: LocalizedPublicationCopy, fr: LocalizedPublicationCopy, ar: LocalizedPublicationCopy }
 * }} PublicationContent
 */

const AUTHOR = "Dr. Said-Alaoui Moulay Abdellah";

/** @type {PublicationContent[]} */
export const PUBLICATION_CONTENT = [
  {
    id: "nature-to-factory",
    slug: "nature-to-factory",
    category: "nutrition",
    author: AUTHOR,
    editions: {
      en: {
        title:
          "From Nature to the Factory: The Hidden History of Our Meals and Their Impact on Health",
        summary:
          "A history of how human food moved from the hunter-gatherer diet through agriculture to industrial production.",
        description:
          "This booklet traces major changes in human nutrition from prehistory to the modern industrial era. It examines cereals, animal milk, cooking, refinement, and the relationship between food and evolution.",
      },
      fr: {
        title:
          "De la nature à l’usine : l’histoire cachée de nos repas et ses impacts sur la santé",
        summary:
          "Une histoire de l’alimentation humaine, des chasseurs-cueilleurs à l’agriculture puis à la production industrielle.",
        description:
          "Ce fascicule retrace les grandes transformations de l’alimentation humaine, de la préhistoire à l’ère industrielle. Il aborde les céréales, les laits animaux, la cuisson, le raffinage et les liens entre alimentation et évolution.",
      },
      ar: {
        title: "من الطبيعة إلى المصنع: التاريخ الخفي لوجباتنا وآثارها على الصحة",
        summary:
          "رحلة في تاريخ غذاء الإنسان، من الصيد وجمع الثمار إلى الزراعة ثم الإنتاج الصناعي.",
        description:
          "يتتبع هذا الكتيّب التحولات الكبرى في تغذية الإنسان من عصور ما قبل التاريخ إلى العصر الصناعي. ويتناول الحبوب وألبان الحيوانات والطهي والتكرير والعلاقة بين الغذاء والتطور.",
      },
    },
  },
  {
    id: "hypotoxic-nutrition",
    slug: "hypotoxic-nutrition",
    category: "nutrition",
    author: AUTHOR,
    editions: {
      en: {
        title: "Hypotoxic Nutrition: A Daily Health Tool",
        summary:
          "A practical introduction to fresh foods, gentle cooking, digestive rhythms, and the principles of hypotoxic nutrition.",
        description:
          "This booklet presents hypotoxic nutrition as an everyday approach centered on simple, minimally processed foods. It discusses food choices, low-temperature preparation, digestive rhythms, and practical application in a Moroccan context.",
      },
      fr: {
        title: "L’alimentation hypotoxique : un outil de santé au quotidien",
        summary:
          "Une introduction pratique aux aliments frais, aux cuissons douces, aux rythmes digestifs et aux principes hypotoxiques.",
        description:
          "Ce fascicule présente l’alimentation hypotoxique comme une démarche quotidienne fondée sur des aliments simples et peu transformés. Il aborde les choix alimentaires, les cuissons à basse température, les rythmes digestifs et leur application dans le contexte marocain.",
      },
      ar: {
        title: "التغذية منخفضة السمية: أداة للصحة في الحياة اليومية",
        summary:
          "مقدمة عملية حول الأغذية الطازجة والطهي اللطيف والإيقاعات الهضمية ومبادئ التغذية منخفضة السمية.",
        description:
          "يقدّم هذا الكتيّب التغذية منخفضة السمية كمقاربة يومية ترتكز على أطعمة بسيطة وقليلة التصنيع. ويتناول اختيار الأغذية والطهي بدرجات منخفضة واحترام الإيقاعات الهضمية والتطبيق العملي في السياق المغربي.",
      },
    },
  },
  {
    id: "enzymes",
    slug: "enzymes",
    category: "nutrition",
    author: AUTHOR,
    editions: {
      en: {
        title: "The Enzymes: Keys to Life and Health",
        summary:
          "An accessible guide to enzymes, how they catalyze biological reactions, and the factors that influence their activity.",
        description:
          "This guide introduces enzymes, their modes of action, regulation, classification, coenzymes, inhibitors, and activators. It also explores the booklet’s concept of enzymatic capital and its relationship to nutrition.",
      },
      fr: {
        title: "Les enzymes : clés de la vie et de la santé",
        summary:
          "Un guide accessible sur les enzymes, leur rôle de catalyseurs biologiques et les facteurs qui influencent leur activité.",
        description:
          "Ce guide présente les enzymes, leur fonctionnement, leur régulation, leur classification, les coenzymes, les inhibiteurs et les activateurs. Il explore aussi la notion de capital enzymatique développée dans le fascicule et son lien avec l’alimentation.",
      },
      ar: {
        title: "الإنزيمات: مفاتيح الحياة والصحة",
        summary:
          "دليل مبسّط حول الإنزيمات ودورها كمحفزات للتفاعلات الحيوية والعوامل التي تؤثر في نشاطها.",
        description:
          "يعرّف هذا الدليل بالإنزيمات وطريقة عملها وتنظيمها وتصنيفها، وبالمساعدات والمثبطات والمنشطات الإنزيمية. كما يستعرض مفهوم الرصيد الإنزيمي الوارد في الكتيّب وعلاقته بالتغذية.",
      },
    },
  },
  {
    id: "nutrition-key-health",
    slug: "nutrition-key-health",
    category: "nutrition",
    author: AUTHOR,
    editions: {
      en: {
        title: "Nutrition: The Key to Health",
        summary:
          "A concise introduction to nutrition, body balance, and the booklet’s hypotoxic approach to everyday food choices.",
        description:
          "This booklet invites readers to consider the place of nutrition in the body’s dynamic balance. It makes the principles of the author’s hypotoxic approach accessible through observations and practical orientation.",
      },
      fr: {
        title: "Nutrition : la clé de la santé",
        summary:
          "Une introduction concise à l’alimentation, à l’équilibre du corps et à l’approche hypotoxique des choix quotidiens.",
        description:
          "Ce fascicule invite à considérer la place de la nutrition dans l’équilibre dynamique du corps. Il rend accessibles les principes de l’approche hypotoxique de l’auteur à travers des repères et une orientation pratique.",
      },
      ar: {
        title: "التغذية: مفتاح الصحة",
        summary:
          "مقدمة موجزة حول الغذاء وتوازن الجسم ومقاربة الكتيّب منخفضة السمية للاختيارات اليومية.",
        description:
          "يدعو هذا الكتيّب إلى تأمل مكانة التغذية في التوازن الديناميكي للجسم. ويعرض مبادئ مقاربة المؤلف منخفضة السمية بأسلوب مبسّط يجمع بين الفهم والتوجيه العملي.",
      },
    },
  },
  {
    id: "hypotoxic-diet-principles",
    slug: "hypotoxic-diet-principles",
    category: "nutrition",
    author: AUTHOR,
    editions: {
      en: {
        title:
          "The Principles of the Hypotoxic Diet: A Practical Guide to an Ancestral and Protective Diet",
        summary:
          "A food-by-food guide to the foundations and practical recommendations of the author’s hypotoxic diet.",
        description:
          "This practical guide contrasts an ancestral-style diet with changes associated with agriculture and industrialization. It reviews the diet’s foundations, individual food groups, preparation methods, and complementary recommendations.",
      },
      fr: {
        title:
          "Les principes du régime hypotoxique : un guide pratique pour une alimentation originelle et protectrice",
        summary:
          "Un guide aliment par aliment sur les bases et les recommandations pratiques du régime hypotoxique de l’auteur.",
        description:
          "Ce guide pratique met en regard une alimentation d’inspiration ancestrale et les changements liés à l’agriculture puis à l’industrialisation. Il passe en revue les bases du régime, les familles d’aliments, les modes de préparation et les mesures complémentaires.",
      },
      ar: {
        title: "مبادئ النظام الغذائي منخفض السمية: دليل عملي لتغذية أصلية وواقية",
        summary:
          "دليل يتناول الأغذية واحدًا واحدًا ويعرض أسس النظام منخفض السمية وتوصياته العملية.",
        description:
          "يقارن هذا الدليل العملي بين التغذية المستوحاة من الأنماط القديمة والتحولات المرتبطة بالزراعة والتصنيع. ويستعرض أسس النظام ومجموعات الأغذية وطرق التحضير والتدابير المكمّلة.",
      },
    },
  },
  {
    id: "basedow-disease",
    slug: "basedow-disease",
    category: "conditions",
    author: AUTHOR,
    editions: {
      en: {
        title: "Basedow: Understanding and Acting",
        summary:
          "A practical overview of Graves’ disease, its signs, examinations, progression, treatment, and proposed mechanisms.",
        description:
          "This booklet explains Graves’ disease as autoimmune hyperthyroidism and describes common clinical signs and complementary examinations. It also reviews treatment, possible contributing factors, clinical observations, and the author’s nutritional perspective.",
      },
      fr: {
        title: "Basedow : comprendre et agir",
        summary:
          "Un aperçu pratique de la maladie de Basedow, de ses signes, examens, évolution, traitements et mécanismes proposés.",
        description:
          "Ce fascicule explique la maladie de Basedow comme une hyperthyroïdie auto-immune et décrit ses signes cliniques et examens complémentaires. Il présente aussi les traitements, les facteurs envisagés, des observations cliniques et le regard nutritionnel de l’auteur.",
      },
      ar: {
        title: "مرض بازيدوف: فهمه واتخاذ الإجراءات اللازمة",
        summary:
          "عرض عملي لمرض بازيدوف وعلاماته وفحوصه وتطوره وعلاجه والآليات المقترحة لتفسيره.",
        description:
          "يشرح هذا الكتيّب مرض بازيدوف بوصفه فرط نشاط مناعي ذاتي للغدة الدرقية، ويعرض العلامات السريرية والفحوص المكملة. كما يتناول العلاج والعوامل المحتملة والملاحظات السريرية ومنظور المؤلف الغذائي.",
      },
    },
  },
  {
    id: "diabetes-hyperinsulinism",
    slug: "diabetes-hyperinsulinism",
    category: "conditions",
    author: AUTHOR,
    editions: {
      en: {
        title:
          "Diabetes & Hyperinsulinism: Practical Guidelines for Balancing Blood Sugar",
        summary:
          "Practical orientation on diabetes, hyperinsulinism, hypotoxic nutrition, adapted cooking, and daily routines.",
        description:
          "This booklet introduces diabetes and metabolic disorders associated with hyperinsulinism in accessible language. It combines explanations of biological processes with food strategies, daily-life guidance, educational annexes, and practical sheets.",
      },
      fr: {
        title:
          "Diabète & hyperinsulinisme : conseils pratiques pour équilibrer sa glycémie",
        summary:
          "Des repères sur le diabète, l’hyperinsulinisme, l’alimentation hypotoxique, la cuisine adaptée et le quotidien.",
        description:
          "Ce fascicule présente dans un langage accessible le diabète et les troubles métaboliques liés à l’hyperinsulinisme. Il associe explications biologiques, stratégies alimentaires, conseils de vie quotidienne, annexes pédagogiques et fiches pratiques.",
      },
      ar: {
        title: "داء السكري وفرط الإنسولين: نصائح عملية لموازنة سكر الدم",
        summary:
          "إرشادات حول السكري وفرط الإنسولين والتغذية منخفضة السمية والطهي المكيّف والعادات اليومية.",
        description:
          "يقدّم هذا الكتيّب شرحًا مبسّطًا للسكري والاضطرابات الأيضية المرتبطة بفرط الإنسولين. ويجمع بين توضيح العمليات الحيوية واستراتيجيات الغذاء ونصائح الحياة اليومية والمالحق التعليمية والأوراق العملية.",
      },
    },
  },
  {
    id: "liver-immunity",
    slug: "liver-immunity",
    category: "conditions",
    author: AUTHOR,
    editions: {
      en: {
        title: "Liver and Immunity: Understanding and Acting",
        summary:
          "A clear guide to autoimmune hepatitis, primary biliary cholangitis, and primary sclerosing cholangitis.",
        description:
          "This booklet explains three autoimmune liver and bile-duct conditions, their signs, mechanisms, and clinical follow-up. It presents standard medical care alongside the author’s discussion of nutrition as a complementary consideration.",
      },
      fr: {
        title: "Foie et immunité : comprendre et agir",
        summary:
          "Un guide clair sur l’hépatite auto-immune, la cholangite biliaire primitive et la cholangite sclérosante primitive.",
        description:
          "Ce fascicule explique trois affections auto-immunes du foie et des voies biliaires, leurs signes, leurs mécanismes et leur suivi. Il présente la prise en charge médicale et la réflexion de l’auteur sur l’alimentation comme approche complémentaire.",
      },
      ar: {
        title: "الكبد والمناعة: كيف نفهم وكيف نعمل",
        summary:
          "دليل مبسّط حول التهاب الكبد المناعي الذاتي والتهاب القنوات الصفراوية الأولي والمصلّب الأولي.",
        description:
          "يشرح هذا الكتيّب ثلاثة أمراض مناعية تصيب الكبد والقنوات الصفراوية، مع علاماتها وآلياتها ومتابعتها السريرية. ويعرض الرعاية الطبية إلى جانب مناقشة المؤلف لدور التغذية كمقاربة مكمّلة.",
      },
    },
  },
  {
    id: "hashimoto-disease",
    slug: "hashimoto-disease",
    category: "conditions",
    author: AUTHOR,
    editions: {
      en: {
        title: "Hashimoto: Turning the Plate into Daily Care",
        summary:
          "A concise explanation of Hashimoto’s thyroiditis with protective-nutrition ideas and practical daily guidance.",
        description:
          "This booklet explains how Hashimoto’s thyroiditis affects the thyroid and describes commonly reported signs. It then presents the author’s protective-nutrition framework, adapted cooking strategies, and practical reference material.",
      },
      fr: {
        title: "Hashimoto : transformer l’assiette en soin quotidien",
        summary:
          "Une explication concise de la thyroïdite de Hashimoto, avec des repères nutritionnels et des conseils pratiques.",
        description:
          "Ce fascicule explique comment la thyroïdite de Hashimoto affecte la thyroïde et décrit les signes fréquemment rapportés. Il présente ensuite le cadre nutritionnel protecteur de l’auteur, des stratégies culinaires adaptées et des repères pratiques.",
      },
      ar: {
        title: "هاشيموتو: اجعل الطعام عناية يومية",
        summary:
          "شرح موجز اللتهاب الغدة الدرقية لهاشيموتو مع أفكار للتغذية الوقائية وإرشادات يومية عملية.",
        description:
          "يشرح هذا الكتيّب تأثير التهاب هاشيموتو في الغدة الدرقية ويعرض العلامات الشائعة. ثم يقدّم إطار المؤلف للتغذية الوقائية واستراتيجيات الطهي الملائمة ومراجع عملية للحياة اليومية.",
      },
    },
  },
  {
    id: "chronic-inflammation",
    slug: "chronic-inflammation",
    category: "conditions",
    author: AUTHOR,
    editions: {
      en: {
        title: "Chronic Inflammation: An Inner Fire to Soothe",
        summary:
          "An introduction to chronic inflammation, its proposed causes and mechanisms, and food and lifestyle considerations.",
        description:
          "This booklet distinguishes protective acute inflammation from persistent chronic inflammation. It surveys contributing factors, associated conditions, biological mechanisms, and the author’s food and lifestyle framework.",
      },
      fr: {
        title: "Inflammation chronique : un feu intérieur à apaiser",
        summary:
          "Une introduction à l’inflammation chronique, à ses causes et mécanismes proposés, puis aux repères alimentaires et de vie.",
        description:
          "Ce fascicule distingue l’inflammation aiguë protectrice de l’inflammation chronique persistante. Il passe en revue les facteurs associés, les maladies concernées, les mécanismes biologiques et les repères alimentaires et de mode de vie de l’auteur.",
      },
      ar: {
        title: "الالتهاب المزمن: نار داخلية يجب تهدئتها",
        summary:
          "مقدمة حول الالتهاب المزمن وأسبابه وآلياته المقترحة، ثم الاعتبارات الغذائية والحياتية.",
        description:
          "يميّز هذا الكتيّب بين الالتهاب الحاد الواقي والالتهاب المزمن المستمر. ويستعرض العوامل المرتبطة به والحالات المصاحبة وآلياته الحيوية، إلى جانب إطار المؤلف للغذاء ونمط الحياة.",
      },
    },
  },
  {
    id: "rheumatoid-arthritis",
    slug: "rheumatoid-arthritis",
    category: "conditions",
    author: AUTHOR,
    editions: {
      en: {
        title: "Rheumatoid Arthritis: Understand, Prevent, Relieve",
        summary:
          "A broad guide to rheumatoid arthritis, from symptoms and joint changes to treatment, nutrition, and the gut microbiota.",
        description:
          "This booklet explains rheumatoid arthritis for patients, families, and caregivers. It covers diagnosis, joint lesions, progression, medicinal treatments, genetic and environmental factors, nutrition, intestinal bacteria, and therapeutic perspectives.",
      },
      fr: {
        title: "Polyarthrite rhumatoïde : comprendre, prévenir, soulager",
        summary:
          "Un guide sur la polyarthrite, de ses symptômes et lésions aux traitements, à l’alimentation et au microbiote intestinal.",
        description:
          "Ce fascicule explique la polyarthrite rhumatoïde aux patients, aux familles et aux soignants. Il aborde le diagnostic, les lésions articulaires, l’évolution, les traitements médicamenteux, les facteurs génétiques et environnementaux, l’alimentation et le microbiote.",
      },
      ar: {
        title: "التهاب المفاصل الروماتويدي: الفهم، الوقاية، التخفيف",
        summary:
          "دليل حول التهاب المفاصل الروماتويدي، من الأعراض والآفات إلى العلاج والتغذية والميكروبيوتا المعوية.",
        description:
          "يشرح هذا الكتيّب التهاب المفاصل الروماتويدي للمرضى والأسر والممارسين الصحيين. ويتناول التشخيص والآفات المفصلية وتطور المرض والعلاجات الدوائية والعوامل الجينية والبيئية والتغذية والبكتيريا المعوية.",
      },
    },
  },
  {
    id: "pregnancy",
    slug: "pregnancy",
    category: "pregnancy",
    author: AUTHOR,
    editions: {
      en: {
        title:
          "Hypotoxic Pregnancy: A Sacred Journey from the Desire for a Child to the Postpartum",
        summary:
          "A practical and holistic companion to motherhood, from preconception through pregnancy, birth, and postpartum.",
        description:
          "This guide follows the physical, emotional, relational, and cultural dimensions of the journey to motherhood. It brings the author’s hypotoxic approach into a Moroccan context, from the desire for a child through postpartum life.",
      },
      fr: {
        title:
          "Grossesse hypotoxique : un voyage sacré du désir d’enfant au post-partum",
        summary:
          "Un accompagnement pratique et holistique de la maternité, du projet d’enfant à la grossesse, la naissance et l’après-naissance.",
        description:
          "Ce guide suit les dimensions physiques, émotionnelles, relationnelles et culturelles du chemin vers la maternité. Il inscrit l’approche hypotoxique de l’auteur dans le contexte marocain, du désir d’enfant au post-partum.",
      },
      ar: {
        title: "حمل منخفض السمية: رحلة مقدسة من الرغبة في الإنجاب إلى ما بعد الولادة",
        summary:
          "دليل عملي وشمولي لألمومة، من مرحلة ما قبل الحمل مرورا بالحمل والوالدة وصوال إلى ما بعد الوالدة.",
        description:
          "يتابع هذا الدليل الأبعاد الجسدية والعاطفية والعلائقية والثقافية لرحلة الأمومة. ويضع مقاربة المؤلف منخفضة السمية في السياق المغربي، من الرغبة في الإنجاب إلى مرحلة ما بعد الولادة.",
      },
    },
  },
  {
    id: "invisible-environmental-threats",
    slug: "invisible-environmental-threats",
    category: "environment",
    author: AUTHOR,
    editions: {
      en: {
        title: "The Invisible Threats in Our Environment",
        summary:
          "A survey of radiation, physical agents, pollutants, biological agents, additives, and psychological stressors.",
        description:
          "This booklet maps environmental influences that may enter daily life through air, water, soil, food, behavior, and emotion. It explains the author’s view of their interaction with biological mechanisms and offers a protective framework centered on awareness and nutrition.",
      },
      fr: {
        title: "Les menaces invisibles de notre environnement",
        summary:
          "Un panorama des rayonnements, agents physiques, polluants, agents biologiques, additifs et facteurs de stress psychique.",
        description:
          "Ce fascicule cartographie les influences environnementales présentes dans l’air, l’eau, le sol, l’alimentation, les comportements et les émotions. Il présente leur interaction avec les mécanismes biologiques selon l’auteur et un cadre protecteur fondé sur la vigilance et l’alimentation.",
      },
      ar: {
        title: "المخاطر غير المرئية في بيئتنا",
        summary:
          "عرض للإشعاعات والعوامل الفيزيائية والملوثات والعوامل البيولوجية والمضافات والضغوط النفسية.",
        description:
          "يرسم هذا الكتيّب خريطة للتأثيرات البيئية التي تصل إلى الحياة اليومية عبر الهواء والماء والتربة والغذاء والسلوك والمشاعر. ويشرح منظور المؤلف لتفاعلها مع الآليات الحيوية، ويعرض إطارًا وقائيًا قائمًا على الوعي والتغذية.",
      },
    },
  },
];
