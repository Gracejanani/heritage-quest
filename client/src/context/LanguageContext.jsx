import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const LanguageContext = createContext(null);
const STORAGE_KEY = "heritageQuest:language";

export const languages = [
  { code: "en", label: "English", translationCode: "en" },
  { code: "as", label: "অসমীয়া", english: "Assamese", translationCode: "as" },
  { code: "bn", label: "বাংলা", english: "Bengali", translationCode: "bn" },
  { code: "brx", label: "बड़ो", english: "Bodo", translationCode: "brx" },
  { code: "doi", label: "डोगरी", english: "Dogri", translationCode: "doi" },
  { code: "gu", label: "ગુજરાતી", english: "Gujarati", translationCode: "gu" },
  { code: "hi", label: "हिन्दी", english: "Hindi", translationCode: "hi" },
  { code: "kn", label: "ಕನ್ನಡ", english: "Kannada", translationCode: "kn" },
  { code: "ks", label: "کٲشُر", english: "Kashmiri", translationCode: "ks" },
  { code: "gom", label: "कोंकणी", english: "Konkani", translationCode: "gom" },
  { code: "mai", label: "मैथिली", english: "Maithili", translationCode: "mai" },
  { code: "ml", label: "മലയാളം", english: "Malayalam", translationCode: "ml" },
  { code: "mni", label: "মৈতৈলোন", english: "Manipuri", translationCode: "mni" },
  { code: "mr", label: "मराठी", english: "Marathi", translationCode: "mr" },
  { code: "ne", label: "नेपाली", english: "Nepali", translationCode: "ne" },
  { code: "or", label: "ଓଡ଼ିଆ", english: "Odia", translationCode: "or" },
  { code: "pa", label: "ਪੰਜਾਬੀ", english: "Punjabi", translationCode: "pa" },
  { code: "sa", label: "संस्कृतम्", english: "Sanskrit", translationCode: "sa" },
  { code: "sat", label: "ᱥᱟᱱᱛᱟᱲᱤ", english: "Santali", translationCode: "sat" },
  { code: "sd", label: "سنڌي", english: "Sindhi", translationCode: "sd" },
  { code: "ta", label: "தமிழ்", english: "Tamil", translationCode: "ta" },
  { code: "te", label: "తెలుగు", english: "Telugu", translationCode: "te" },
  { code: "ur", label: "اردو", english: "Urdu", translationCode: "ur" },
];

const languageCodeMap = Object.fromEntries(
  languages.map((item) => [item.code, item.translationCode || item.code]),
);

const ui = {
  en: {
    home: "Home",
    games: "Games",
    learn: "Learn",
    leaderboard: "Leaderboard",
    about: "About",
    achievements: "Achievements",
    profile: "Profile",
    switchExplorer: "Log out",
    language: "Language",
    learningHub: "LEARNING HUB",
    exploreLearnGrow: "Explore. Learn. Grow.",
    learningIntro:
      "Discover history, culture, science and heritage through focused study materials and 10-question challenges.",
    searchLearning: "Search chapters, monuments, culture, science...",
    readChapter: "Read Chapter",
    studyMaterial: "Study material",
    backToLearn: "Back to Learn",
    whatYouLearn: "What you'll learn",
    learningApproach: "Learning approach",
    source: "Reference source",
    wikipediaReference: "Wikipedia reference",
    quizNormal: "Normal",
    quizAdvanced: "Advanced",
    normalAdvanced: "7 Normal + 3 Advanced",
    question: "Question",
    of: "of",
    hint: "Hint",
    learnFirst: "Learn",
    next: "Next",
    finish: "Finish",
    correct: "Correct!",
    notQuite: "Not quite.",
    chapterComplete: "Chapter Completed!",
    journeyTag: "YOUR JOURNEY, YOUR PROGRESS",
    welcome: "Welcome to Heritage Quest",
    gateCopy:
      "Enter your name and date of birth to begin. Together they identify your prototype profile on this browser, so your unfinished quests, scores and progress stay separate from other students.",
    yourName: "Your name",
    dateOfBirth: "Date of birth",
    enterQuest: "Enter Quest",
    recentExplorers: "Recent explorers on this browser",
    continueAs: "Continue as",
    separateJourney: "Every explorer gets a separate journey.",
    separateJourneyCopy:
      "Name + date of birth keeps each prototype profile distinct, even when two students have the same name.",
    searchPlaceholder: "Search games, chapters...",
    rewards: "Rewards",
    translating: "Translating...",
    correctAnswer: "Correct answer",
    login: "Login",
    register: "Register",
    createExplorerAccount: "Create your explorer account",
    welcomeBack: "Welcome back",
    registerCopy:
      "Register once with email, password and date of birth. Your age automatically chooses the right question level.",
    loginCopy:
      "Use the same email and password you registered with to continue your saved learning journey.",
    studentName: "Student name",
    email: "Email",
    password: "Password",
    passwordHint: "Minimum 6 characters",
    registerEnter: "Register & Enter",
    loginContinue: "Login & Continue",
    pleaseWait: "Please wait…",
  },
  ta: {
    home: "முகப்பு",
    games: "விளையாட்டுகள்",
    learn: "கற்றல்",
    leaderboard: "முன்னிலைப் பட்டியல்",
    about: "எங்களைப் பற்றி",
    achievements: "சாதனைகள்",
    profile: "சுயவிவரம்",
    switchExplorer: "வெளியேறு",
    language: "மொழி",
    learningHub: "கற்றல் மையம்",
    exploreLearnGrow: "ஆராய். கற்று. வளரு.",
    learningIntro:
      "வரலாறு, கலாசாரம், அறிவியல் மற்றும் பாரம்பரியத்தை சுருக்கமான கற்றல் தொகுப்புகளும் 10 கேள்வி சவால்களும் மூலம் அறிந்து கொள்ளுங்கள்.",
    searchLearning: "அத்தியாயங்கள், நினைவுச்சின்னங்கள், கலாசாரம், அறிவியல்...",
    readChapter: "படிக்க",
    studyMaterial: "கற்றல் தொகுப்பு",
    backToLearn: "கற்றலுக்கு திரும்பு",
    whatYouLearn: "நீங்கள் கற்பது",
    learningApproach: "கற்றல் முறை",
    source: "ஆதார மூலம்",
    wikipediaReference: "விக்கிப்பீடியா ஆதாரம்",
    quizNormal: "சாதாரணம்",
    quizAdvanced: "மேம்பட்டது",
    normalAdvanced: "7 சாதாரணம் + 3 மேம்பட்டது",
    question: "கேள்வி",
    of: "இல்",
    hint: "குறிப்பு",
    learnFirst: "முதலில் கற்று",
    next: "அடுத்து",
    finish: "முடி",
    correct: "சரி!",
    notQuite: "முழுமையாக இல்லை.",
    chapterComplete: "அத்தியாயம் முடிந்தது!",
    journeyTag: "உங்கள் பயணம், உங்கள் முன்னேற்றம்",
    welcome: "Heritage Quest-க்கு வரவேற்கிறோம்",
    gateCopy:
      "தொடங்க உங்கள் பெயரும் பிறந்த தேதியும் உள்ளிடுங்கள். இவை இந்த உலாவியில் உங்கள் மாதிரி சுயவிவரத்தை தனித்துவமாக அடையாளம் கண்டு, உங்கள் முன்னேற்றத்தை மற்ற மாணவர்களிலிருந்து தனியாக வைத்திருக்கும்.",
    yourName: "உங்கள் பெயர்",
    dateOfBirth: "பிறந்த தேதி",
    enterQuest: "Quest-க்கு நுழை",
    recentExplorers: "இந்த உலாவியில் சமீபத்திய பயனர்கள்",
    continueAs: "தொடரவும்",
    separateJourney: "ஒவ்வொரு பயனருக்கும் தனி பயணம்.",
    separateJourneyCopy:
      "ஒரே பெயர் கொண்ட மாணவர்கள் இருந்தாலும் பெயர் + பிறந்த தேதி மூலம் தனித்தனி மாதிரி சுயவிவரங்கள் உருவாகும்.",
    searchPlaceholder: "விளையாட்டுகள், அத்தியாயங்கள் தேடுங்கள்...",
    rewards: "வெகுமதிகள்",
    translating: "மொழிபெயர்க்கப்படுகிறது...",
    correctAnswer: "சரியான பதில்",
    login: "உள்நுழை",
    register: "பதிவு செய்",
    createExplorerAccount: "உங்கள் பயனர் கணக்கை உருவாக்குங்கள்",
    welcomeBack: "மீண்டும் வரவேற்கிறோம்",
    registerCopy:
      "மின்னஞ்சல், கடவுச்சொல் மற்றும் பிறந்த தேதியுடன் ஒருமுறை பதிவு செய்யுங்கள். உங்கள் வயதுக்கு ஏற்ற கேள்வி நிலை தானாகத் தேர்ந்தெடுக்கப்படும்.",
    loginCopy:
      "நீங்கள் பதிவு செய்த அதே மின்னஞ்சல் மற்றும் கடவுச்சொல்லைப் பயன்படுத்தி சேமிக்கப்பட்ட கற்றல் பயணத்தைத் தொடருங்கள்.",
    studentName: "மாணவர் பெயர்",
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    passwordHint: "குறைந்தது 6 எழுத்துகள்",
    registerEnter: "பதிவு செய்து நுழை",
    loginContinue: "உள்நுழைந்து தொடரு",
    pleaseWait: "தயவுசெய்து காத்திருக்கவும்…",
  },
  hi: {
    home: "होम",
    games: "गेम्स",
    learn: "सीखें",
    leaderboard: "लीडरबोर्ड",
    about: "हमारे बारे में",
    achievements: "उपलब्धियाँ",
    profile: "प्रोफ़ाइल",
    switchExplorer: "लॉग आउट",
    language: "भाषा",
    learningHub: "लर्निंग हब",
    exploreLearnGrow: "खोजें। सीखें। आगे बढ़ें।",
    learningIntro:
      "इतिहास, संस्कृति, विज्ञान और विरासत को छोटे अध्ययन मॉड्यूल और 10-प्रश्न चुनौतियों के माध्यम से जानें।",
    searchLearning: "अध्याय, स्मारक, संस्कृति, विज्ञान खोजें...",
    readChapter: "अध्याय पढ़ें",
    studyMaterial: "अध्ययन सामग्री",
    backToLearn: "सीखने पर वापस जाएँ",
    whatYouLearn: "आप क्या सीखेंगे",
    learningApproach: "सीखने का तरीका",
    source: "संदर्भ स्रोत",
    wikipediaReference: "विकिपीडिया संदर्भ",
    quizNormal: "सामान्य",
    quizAdvanced: "उन्नत",
    normalAdvanced: "7 सामान्य + 3 उन्नत",
    question: "प्रश्न",
    of: "में से",
    hint: "संकेत",
    learnFirst: "पहले सीखें",
    next: "अगला",
    finish: "समाप्त",
    correct: "सही!",
    notQuite: "पूरी तरह सही नहीं।",
    chapterComplete: "अध्याय पूरा हुआ!",
    journeyTag: "आपकी यात्रा, आपकी प्रगति",
    welcome: "Heritage Quest में आपका स्वागत है",
    gateCopy:
      "शुरू करने के लिए अपना नाम और जन्मतिथि दर्ज करें। ये दोनों इस ब्राउज़र पर आपकी प्रोटोटाइप प्रोफ़ाइल को अलग पहचान देते हैं, ताकि आपकी अधूरी क्वेस्ट और प्रगति दूसरे विद्यार्थियों से अलग रहें।",
    yourName: "आपका नाम",
    dateOfBirth: "जन्मतिथि",
    enterQuest: "क्वेस्ट में प्रवेश करें",
    recentExplorers: "इस ब्राउज़र के हाल के विद्यार्थी",
    continueAs: "जारी रखें",
    separateJourney: "हर विद्यार्थी की यात्रा अलग है।",
    separateJourneyCopy:
      "एक ही नाम वाले विद्यार्थियों के लिए भी नाम + जन्मतिथि अलग प्रोटोटाइप प्रोफ़ाइल बनाती है।",
    searchPlaceholder: "गेम्स और अध्याय खोजें...",
    rewards: "रिवॉर्ड्स",
    translating: "अनुवाद हो रहा है...",
    correctAnswer: "सही उत्तर",
    login: "लॉग इन",
    register: "रजिस्टर",
    createExplorerAccount: "अपना एक्सप्लोरर अकाउंट बनाएँ",
    welcomeBack: "वापसी पर स्वागत है",
    registerCopy:
      "ईमेल, पासवर्ड और जन्मतिथि के साथ एक बार रजिस्टर करें। आपकी उम्र के अनुसार सही प्रश्न स्तर अपने आप चुना जाएगा।",
    loginCopy:
      "अपनी सेव की हुई सीखने की यात्रा जारी रखने के लिए वही ईमेल और पासवर्ड इस्तेमाल करें जिससे आपने रजिस्टर किया था।",
    studentName: "विद्यार्थी का नाम",
    email: "ईमेल",
    password: "पासवर्ड",
    passwordHint: "कम से कम 6 अक्षर",
    registerEnter: "रजिस्टर करें और प्रवेश करें",
    loginContinue: "लॉग इन करके जारी रखें",
    pleaseWait: "कृपया प्रतीक्षा करें…",
  },
};

const topicTranslations = {
  ta: {
    "ancient-india": {
      title: "பண்டைய இந்தியா",
      description: "ஆரம்ப குடியேற்றங்கள், வேத மரபுகள், அரசுகள், சிந்தனைகள் மற்றும் தொல்லியல்-உரை ஆதாரங்களை அறிக.",
      learn: ["ஆரம்ப குடியேற்றங்களும் நகரமயமாதலும்", "வேத மற்றும் பிந்தைய வேத சமூகம்", "மகாஜனபதங்கள்", "பௌத்த மற்றும் ஜைன மரபுகள்", "தொல்லியல் மற்றும் எழுத்து ஆதாரங்களை இணைத்துப் படித்தல்"],
    },
    "indus-valley-civilization": {
      title: "சிந்து சமவெளி நாகரிகம்",
      description: "திட்டமிட்ட நகரங்கள், கைவினை உற்பத்தி, வர்த்தகம், முத்திரைகள் மற்றும் தொல்லியல் விளக்கங்களின் வரம்புகளை ஆராய்க.",
      learn: ["நகர திட்டமிடல் மற்றும் வடிகால்", "சிறப்பு கைவினைத் தொழில்", "வர்த்தக வலையமைப்புகள்", "முத்திரைகள் மற்றும் வாசிக்கப்படாத எழுத்து", "தொல்லியல் ஆதாரத்திலிருந்து முடிவு காணுதல்"],
    },
    "maurya-empire": {
      title: "மௌரிய பேரரசு",
      description: "பேரரசு விரிவு, நிர்வாகம், அசோகர் கல்வெட்டுகள், தர்மம் மற்றும் தொலைதூர வலையமைப்புகளைப் படிக்கவும்.",
      learn: ["பேரரசு நிர்வாகம்", "அசோகரும் தர்மமும்", "கல்வெட்டுகள் வரலாற்று ஆதாரமாக", "சாலைகள், வர்த்தகம் மற்றும் தகவல் தொடர்பு", "பிராந்திய ஆட்சி"],
    },
    "gupta-empire": {
      title: "குப்த பேரரசு",
      description: "அரசியல் வரலாற்றுடன் இலக்கியம், கணிதம், வானியல், கலை மற்றும் பிராந்திய அதிகார வளர்ச்சியையும் அறிக.",
      learn: ["அரசியல் அமைப்பு", "அறிவியல் மற்றும் கணிதம்", "சமஸ்கிருத இலக்கியம்", "கோவில் மற்றும் சிற்பக் கலை", "‘பொற்காலம்’ என்ற கருத்தின் விவாதங்கள்"],
    },
    "chola-dynasty": {
      title: "சோழர் வம்சம்",
      description: "சோழ நிர்வாகம், கல்வெட்டுகள், கோவில்கள், வெண்கலக் கலை, பாசனம் மற்றும் இந்தியப் பெருங்கடல் தொடர்புகளை அறிக.",
      learn: ["உள்ளூர் நிர்வாகம்", "கோவில் ஆதரவு", "கடல் வர்த்தகம்", "கடற்படை நடவடிக்கைகள்", "வெண்கலக் கலை மற்றும் கல்வெட்டுகள்"],
    },
    "mughal-empire": {
      title: "முகலாய பேரரசு",
      description: "நிர்வாகம், அரண்மனை கலாசாரம், கட்டிடக்கலை, வருவாய் முறை மற்றும் பிராந்திய அரசியலைப் படிக்கவும்.",
      learn: ["மன்சப்தாரி முறை", "வருவாய் நிர்வாகம்", "கட்டிடக்கலை மற்றும் தோட்டங்கள்", "அரண்மனை கலாசாரம் மற்றும் ஓவியம்", "பிராந்திய அரசியல்"],
    },
    "indian-freedom-movement": {
      title: "இந்திய விடுதலை இயக்கம்",
      description: "அமைப்புகள், பொதுஇயக்கங்கள், அரசியல் விவாதங்கள், புரட்சிகர போக்குகள் மற்றும் சுதந்திரத்தின் காலவரிசையை அறிக.",
      learn: ["தேசிய அமைப்புகள்", "மக்கள் இயக்கங்கள்", "அரசியலமைப்பு அரசியல்", "புரட்சிகர இயக்கங்கள்", "பிரிவினை மற்றும் சுதந்திரம்"],
    },
    "indian-monuments": {
      title: "இந்திய நினைவுச்சின்னங்கள்",
      description: "முக்கிய இந்திய நினைவுச்சின்னங்களின் கட்டிட பாணி, ஆதரவு, பொருட்கள் மற்றும் வரலாற்றுச் சூழலை ஒப்பிடுக.",
      learn: ["கட்டிட பாணிகள்", "ஆதரவு மற்றும் நோக்கம்", "பொருட்கள் மற்றும் பொறியியல்", "பாதுகாப்பு", "பிராந்திய பல்வகைமை"],
    },
    "indian-art-culture": {
      title: "இந்திய கலை மற்றும் கலாசாரம்",
      description: "நடனம், இசை, ஓவியம், கைவினை மற்றும் நிகழ்கலை மரபுகளை ஆராய்க.",
      learn: ["சாஸ்திரிய நடன மரபுகள்", "இசை முறைகள்", "ஓவியப் பள்ளிகள்", "கைவினை மற்றும் நெசவு", "உயிர்வாழும் கலாசார பரிமாற்றம்"],
    },
    "indian-festivals": {
      title: "இந்திய திருவிழாக்கள்",
      description: "பல்வேறு இந்திய திருவிழாக்களின் பிராந்திய, பருவ, வேளாண்மை மற்றும் சமயச் சூழலைப் புரிந்துகொள்ளுங்கள்.",
      learn: ["பருவச் சுழற்சிகள்", "பிராந்திய மரபுகள்", "வேளாண் தொடர்புகள்", "சடங்கு மற்றும் சமூகம்", "கலாசார பல்வகைமை"],
    },
    "states-of-india": {
      title: "இந்திய மாநிலங்கள்",
      description: "இந்திய மாநிலங்களின் புவியியல், மொழிகள், கலாசாரம், வரலாறு மற்றும் இயற்கை நிலப்பரப்புகளை இணைத்து அறிக.",
      learn: ["இயற்கை புவியியல்", "மாநில உருவாக்கம்", "மொழிகள் மற்றும் கலாசாரங்கள்", "தலைநகரங்கள் மற்றும் பிராந்தியங்கள்", "பொருளாதார மற்றும் சூழலியல் பல்வகைமை"],
    },
    "famous-personalities": {
      title: "புகழ்பெற்ற ஆளுமைகள்",
      description: "சிந்தனையாளர்கள், ஆட்சியாளர்கள், சீர்திருத்தவாதிகள், விஞ்ஞானிகள், கலைஞர்கள் மற்றும் விடுதலைத் தலைவர்களின் பங்களிப்புகளை அறிக.",
      learn: ["வரலாற்றுச் சூழல்", "சமூக சீர்திருத்தம்", "அறிவியல் மற்றும் சிந்தனைகள்", "அரசியல் தலைமையியல்", "கலாசார பங்களிப்புகள்"],
    },
    "antikythera-mechanism": {
      title: "ஆண்டிகிதேரா இயந்திரம்",
      description: "பண்டைய கிரேக்கத்தின் கையால் இயக்கப்பட்ட வானியல் கணிப்புக் கருவி எவ்வாறு சிக்கலான கியர்களைப் பயன்படுத்தியது என்பதை அறிக.",
      learn: ["பண்டைய வானியல் கணிப்பு", "வெண்கல கியர் அமைப்பு", "சூரியன் மற்றும் சந்திரன் சுழற்சிகள்", "கிரகணம் கணித்தல்", "தொல்லியல் மறுஉருவாக்கம்"],
      sections: [
        { title: "இது என்ன?", body: "ஆண்டிகிதேரா இயந்திரம் பண்டைய கிரேக்கத்தில் உருவாக்கப்பட்ட, கையால் இயக்கப்படும் வெண்கல கியர் கொண்ட வானியல் கருவி. இது அறியப்பட்ட மிகப் பழமையான அனலாக் கணினி எடுத்துக்காட்டாகப் பரவலாக விவரிக்கப்படுகிறது." },
        { title: "இது என்ன செய்தது?", body: "சூரியன் மற்றும் சந்திரனின் வானியல் சுழற்சிகளைப் பின்தொடரவும், கிரகணங்களை முன்கணிக்கவும் இதன் அமைப்பு பயன்பட்டதாக மறுஉருவாக்கங்கள் காட்டுகின்றன." },
        { title: "எப்படி கண்டுபிடிக்கப்பட்டது?", body: "1901-ல் கிரேக்கத்தின் ஆண்டிகிதேரா தீவுக்கு அருகிலுள்ள கப்பல் சிதைவிலிருந்து இதன் துண்டுகள் மீட்கப்பட்டன. பின்னர் எக்ஸ்-ரே மற்றும் உயர் தெளிவுப் படமெடுப்பு மறைந்த கியர்களையும் எழுத்துகளையும் ஆய்வு செய்ய உதவின." },
        { title: "ஏன் முக்கியம்?", body: "வானியல், கணிதம் மற்றும் நுணுக்கமான உலோக வேலைப்பாடை ஹெலெனிஸ்டிக் கால கைவினைஞர்கள் எவ்வளவு முன்னேற்றமாக இணைத்திருந்தனர் என்பதை இது காட்டுகிறது." },
      ],
    },
    "nalanda-mahavihara": {
      title: "நாளந்தா மகாவிஹாரம்",
      description: "பீகாரில் அமைந்திருந்த புகழ்பெற்ற பௌத்த கல்வி மையமான நாளந்தாவின் வரலாறு மற்றும் அறிவுப் பரிமாற்றத்தை அறிக.",
      learn: ["பௌத்த மகாவிஹார மரபு", "கற்பித்தல் மற்றும் ஆய்வு", "ஆசிய அறிவுப் பரிமாற்றம்", "தொல்லியல் சான்றுகள்", "பாரம்பரிய பாதுகாப்பு"],
      sections: [
        { title: "முக்கிய கற்றல் மையம்", body: "நாளந்தா வரலாற்று மகதப் பகுதியில், இன்றைய பீகாரில் அமைந்த புகழ்பெற்ற பௌத்த மகாவிஹாரம். துறவற வாழ்வு, கற்பித்தல், படிப்பு மற்றும் அறிவியல் விவாதங்கள் ஒன்றிணைந்த முக்கிய மையமாக அது வளர்ந்தது." },
        { title: "பிராந்தியங்களை கடந்த அறிவு", body: "ஆசியாவின் பல பகுதிகளில் இருந்து அறிஞர்களும் மாணவர்களும் நாளந்தாவை அடைந்தனர். பௌத்த சிந்தனை மற்றும் பிற அறிவுத்துறைகள் எவ்வாறு பரவின என்பதை புரிந்துகொள்ள அதன் வரலாறு உதவுகிறது." },
        { title: "இன்று எது மீதமுள்ளது?", body: "மடங்கள் மற்றும் கோவில் அமைப்புகளின் தொல்லியல் எச்சங்கள் நிறுவனம் எவ்வளவு பெரியதாக இருந்தது மற்றும் காலப்போக்கில் எவ்வாறு மாறியது என்பதைக் காட்டுகின்றன." },
        { title: "வரலாற்று எச்சரிக்கை", body: "நாளந்தா அடிக்கடி குடியிருப்பு பல்கலைக்கழகத்துடன் ஒப்பிடப்படுகிறது. ஆனால் நவீன பல்கலைக்கழகக் கருத்துகளை பண்டைய பௌத்த மட கல்வி நிறுவனத்திற்கு நேரடியாகப் பொருத்துவது மிக எளிமைப்படுத்தலாக இருக்கலாம்." },
      ],
    },
  },
  hi: {
    "ancient-india": {
      title: "प्राचीन भारत",
      description: "प्रारंभिक बस्तियों, वैदिक परंपराओं, राज्यों, विचारों और पुरातात्त्विक तथा पाठ्य साक्ष्यों का अध्ययन करें।",
      learn: ["प्रारंभिक बस्तियाँ और नगरीकरण", "वैदिक और उत्तर वैदिक समाज", "महाजनपद", "बौद्ध और जैन परंपराएँ", "पुरातत्त्व और ग्रंथों को साथ पढ़ना"],
    },
    "indus-valley-civilization": {
      title: "सिंधु घाटी सभ्यता",
      description: "नियोजित नगरों, शिल्प, व्यापार, मुहरों और पुरातात्त्विक व्याख्या की सीमाओं का अध्ययन करें।",
      learn: ["नगर नियोजन और जल निकासी", "विशेषीकृत शिल्प", "व्यापार नेटवर्क", "मुहरें और अपठित लिपि", "पुरातात्त्विक निष्कर्ष"],
    },
    "maurya-empire": {
      title: "मौर्य साम्राज्य",
      description: "साम्राज्य विस्तार, प्रशासन, अशोक के अभिलेख, धम्म और दूरगामी नेटवर्क का अध्ययन करें।",
      learn: ["साम्राज्य प्रशासन", "अशोक और धम्म", "अभिलेख ऐतिहासिक स्रोत के रूप में", "सड़कें, व्यापार और संचार", "क्षेत्रीय शासन"],
    },
    "gupta-empire": {
      title: "गुप्त साम्राज्य",
      description: "राजनीतिक इतिहास के साथ साहित्य, गणित, खगोलशास्त्र, कला और क्षेत्रीय शक्ति का अध्ययन करें।",
      learn: ["राजनीतिक संरचना", "विज्ञान और गणित", "संस्कृत साहित्य", "मंदिर और मूर्तिकला", "‘स्वर्ण युग’ की अवधारणा पर बहस"],
    },
    "chola-dynasty": {
      title: "चोल वंश",
      description: "चोल प्रशासन, अभिलेख, मंदिर, कांस्य कला, सिंचाई और हिंद महासागर संबंधों का अध्ययन करें।",
      learn: ["स्थानीय प्रशासन", "मंदिर संरक्षण", "समुद्री व्यापार", "नौसैनिक अभियान", "कांस्य कला और अभिलेख"],
    },
    "mughal-empire": {
      title: "मुगल साम्राज्य",
      description: "प्रशासन, दरबारी संस्कृति, वास्तुकला, राजस्व व्यवस्था और क्षेत्रीय राजनीति का अध्ययन करें।",
      learn: ["मनसबदारी व्यवस्था", "राजस्व प्रशासन", "वास्तुकला और उद्यान", "दरबारी संस्कृति और चित्रकला", "क्षेत्रीय राजनीति"],
    },
    "indian-freedom-movement": {
      title: "भारतीय स्वतंत्रता आंदोलन",
      description: "संगठनों, जन आंदोलनों, संवैधानिक बहसों, क्रांतिकारी धाराओं और स्वतंत्रता की समयरेखा समझें।",
      learn: ["राष्ट्रीय संगठन", "जन आंदोलन", "संवैधानिक राजनीति", "क्रांतिकारी आंदोलन", "विभाजन और स्वतंत्रता"],
    },
    "indian-monuments": {
      title: "भारतीय स्मारक",
      description: "प्रमुख भारतीय स्मारकों की वास्तुशैली, संरक्षण, सामग्री और ऐतिहासिक संदर्भ की तुलना करें।",
      learn: ["वास्तुशैलियाँ", "संरक्षण और उद्देश्य", "सामग्री और अभियांत्रिकी", "संरक्षण कार्य", "क्षेत्रीय विविधता"],
    },
    "indian-art-culture": {
      title: "भारतीय कला और संस्कृति",
      description: "नृत्य, संगीत, चित्रकला, शिल्प और प्रदर्शन की जीवंत परंपराओं को जानें।",
      learn: ["शास्त्रीय नृत्य परंपराएँ", "संगीत प्रणालियाँ", "चित्रकला शैलियाँ", "शिल्प और वस्त्र", "जीवित सांस्कृतिक परंपरा"],
    },
    "indian-festivals": {
      title: "भारतीय त्योहार",
      description: "भारतीय त्योहारों के क्षेत्रीय, मौसमी, कृषि और धार्मिक संदर्भ को समझें।",
      learn: ["मौसमी चक्र", "क्षेत्रीय परंपराएँ", "कृषि संबंध", "अनुष्ठान और समुदाय", "सांस्कृतिक विविधता"],
    },
    "states-of-india": {
      title: "भारत के राज्य",
      description: "भारत के राज्यों और क्षेत्रों की भूगोल, भाषाओं, संस्कृति, इतिहास और परिदृश्य को जोड़कर समझें।",
      learn: ["भौतिक भूगोल", "राज्य निर्माण", "भाषाएँ और संस्कृतियाँ", "राजधानियाँ और क्षेत्र", "आर्थिक और पारिस्थितिक विविधता"],
    },
    "famous-personalities": {
      title: "प्रसिद्ध व्यक्तित्व",
      description: "विचारकों, शासकों, सुधारकों, वैज्ञानिकों, कलाकारों और स्वतंत्रता सेनानियों के योगदान को समझें।",
      learn: ["ऐतिहासिक संदर्भ", "सामाजिक सुधार", "विज्ञान और विचार", "राजनीतिक नेतृत्व", "सांस्कृतिक योगदान"],
    },
    "antikythera-mechanism": {
      title: "एंटीकाइथेरा तंत्र",
      description: "जानें कि प्राचीन यूनानी हाथ से चलने वाला यह खगोलीय गणना उपकरण जटिल गियरों का उपयोग कैसे करता था।",
      learn: ["प्राचीन खगोलीय गणना", "कांस्य गियर प्रणाली", "सूर्य और चंद्र चक्र", "ग्रहण पूर्वानुमान", "पुरातात्त्विक पुनर्निर्माण"],
      sections: [
        { title: "यह क्या था?", body: "एंटीकाइथेरा तंत्र प्राचीन यूनान का हाथ से चलने वाला खगोलीय यंत्र था, जिसमें कांस्य के परस्पर जुड़े गियर थे। इसे ज्ञात सबसे पुराने एनालॉग कंप्यूटर के उदाहरणों में माना जाता है।" },
        { title: "यह क्या कर सकता था?", body: "पुनर्निर्माणों से पता चलता है कि यह सूर्य और चंद्रमा के चक्रों को ट्रैक कर सकता था और ग्रहणों का पूर्वानुमान लगाने में उपयोगी था।" },
        { title: "यह कैसे मिला?", body: "इसके टुकड़े 1901 में यूनानी द्वीप एंटीकाइथेरा के पास एक जहाज़ के मलबे से मिले। बाद की एक्स-रे और उच्च-रिज़ॉल्यूशन इमेजिंग ने छिपे गियरों और अभिलेखों का अध्ययन संभव बनाया।" },
        { title: "यह महत्वपूर्ण क्यों है?", body: "यह दिखाता है कि हेलेनिस्टिक काल के कारीगर खगोलशास्त्र, गणित और सूक्ष्म धातु-कारीगरी को अत्यंत जटिल यांत्रिक रूप में जोड़ सकते थे।" },
      ],
    },
    "nalanda-mahavihara": {
      title: "नालंदा महाविहार",
      description: "बिहार के प्रसिद्ध बौद्ध शिक्षण केंद्र नालंदा के इतिहास और ज्ञान के आदान-प्रदान को जानें।",
      learn: ["बौद्ध महाविहार परंपरा", "शिक्षण और अध्ययन", "एशियाई ज्ञान विनिमय", "पुरातात्त्विक साक्ष्य", "विरासत संरक्षण"],
      sections: [
        { title: "एक प्रमुख शिक्षा केंद्र", body: "नालंदा ऐतिहासिक मगध क्षेत्र, वर्तमान बिहार में स्थित प्रसिद्ध बौद्ध महाविहार था। यह मठवासी जीवन, शिक्षण, अध्ययन और बौद्धिक आदान-प्रदान का महत्वपूर्ण केंद्र बना।" },
        { title: "क्षेत्रों के पार ज्ञान", body: "एशिया के विभिन्न भागों से विद्वान और विद्यार्थी नालंदा आते थे। इसका इतिहास बताता है कि बौद्ध विचार और अन्य ज्ञान परंपराएँ व्यापक नेटवर्कों में कैसे फैलीं।" },
        { title: "आज क्या बचा है?", body: "मठों और मंदिरों के पुरातात्त्विक अवशेष संस्था के आकार और समय के साथ बदलते विन्यास को समझने में मदद करते हैं।" },
        { title: "एक ऐतिहासिक सावधानी", body: "नालंदा की तुलना अक्सर आवासीय विश्वविद्यालय से की जाती है, लेकिन आधुनिक विश्वविद्यालय की श्रेणियों को सीधे एक पूर्व-आधुनिक बौद्ध मठ संस्थान पर लागू करना ऐतिहासिक रूप से सावधानी मांगता है।" },
      ],
    },
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return languages.some((item) => item.code === saved) ? saved : "en";
  });

  const [dynamicUi, setDynamicUi] = useState({});

  const setLanguage = (code) => {
    const next = languages.some((item) => item.code === code) ? code : "en";
    localStorage.setItem(STORAGE_KEY, next);
    setLanguageState(next);

    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        const userId = data?.user?.id;
        if (!userId) return;
        supabase
          .from("profiles")
          .update({
            preferred_language: next,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .then(({ error }) => {
            if (error) console.error("Could not save preferred language", error);
          });
      });
    }
  };

  const translateText = useCallback(
    async (text, target = language) => {
      if (!text || target === "en") return text;

      const targetCode = languageCodeMap[target] || target;
      const sourceText = String(text);
      let hash = 0;
      for (let i = 0; i < sourceText.length; i += 1) {
        hash = (hash * 31 + sourceText.charCodeAt(i)) >>> 0;
      }
      const cacheKey = `heritageQuest:translation:${targetCode}:${hash}`;

      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;
      } catch {
        // Ignore storage failures and translate normally.
      }

      try {
        const url =
          "https://api.mymemory.translated.net/get?q=" +
          encodeURIComponent(sourceText.slice(0, 450)) +
          "&langpair=en|" +
          encodeURIComponent(targetCode);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Translation request failed");
        const data = await response.json();
        const translated = data?.responseData?.translatedText;
        const safe =
          typeof translated === "string" &&
          translated.trim() &&
          !translated.toUpperCase().includes("MYMEMORY WARNING")
            ? translated
            : sourceText;
        try {
          localStorage.setItem(cacheKey, safe);
        } catch {
          // Cache is optional.
        }
        return safe;
      } catch {
        return sourceText;
      }
    },
    [language],
  );

  useEffect(() => {
    let active = true;

    if (ui[language]) {
      setDynamicUi({});
      return () => {
        active = false;
      };
    }

    const entries = Object.entries(ui.en);
    Promise.all(
      entries.map(async ([key, value]) => [key, await translateText(value, language)]),
    ).then((translatedEntries) => {
      if (active) setDynamicUi(Object.fromEntries(translatedEntries));
    });

    return () => {
      active = false;
    };
  }, [language, translateText]);

  const t = (key) =>
    ui[language]?.[key] || dynamicUi[key] || ui.en[key] || key;

  const localizeTopic = (topic) => {
    if (language === "en") return topic;
    const translated = topicTranslations[language]?.[topic.slug];
    return translated ? { ...topic, ...translated } : topic;
  };

  const value = useMemo(
    () => ({ language, setLanguage, languages, t, localizeTopic, translateText }),
    [language, translateText, dynamicUi],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
