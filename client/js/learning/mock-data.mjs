export const mockLanguages = [
  {
    id: "zh-TW",
    language: "Chinese",
    nativeName: "繁體中文",
    scriptLabel: "Traditional Chinese",
    locale: "zh-TW",
    sourceLanguage: "English",
    description: "Build practical Traditional Chinese for introductions, travel, and everyday conversations.",
    availability: "Preview course available",
    downloadSize: "42 MB",
    version: "Preview 0.2"
  }
];

export const mockCategories = [
  {
    id: "introduction",
    order: 1,
    name: "Introduction",
    description: "Share your name, where you are from, and the first details that begin a conversation.",
    progress: 100,
    wordCount: 18,
    lessonCount: 4,
    status: "review_due",
    icon: "message-circle",
    accent: "red"
  },
  {
    id: "occupation",
    order: 2,
    name: "Occupation",
    description: "Talk naturally about work, study, roles, and the people you meet each day.",
    progress: 100,
    wordCount: 20,
    lessonCount: 4,
    status: "completed",
    icon: "briefcase-business",
    accent: "teal"
  },
  {
    id: "traveling",
    order: 3,
    name: "Traveling",
    description: "Ask where to go, understand directions, and keep a simple journey moving.",
    progress: 55,
    wordCount: 24,
    lessonCount: 5,
    status: "in_progress",
    icon: "map",
    accent: "blue"
  },
  {
    id: "airport",
    order: 4,
    name: "Airport",
    description: "Find check-in, understand essential signs, and handle common airport questions.",
    progress: 0,
    wordCount: 22,
    lessonCount: 5,
    status: "available",
    icon: "plane",
    accent: "amber"
  },
  {
    id: "hotel",
    order: 5,
    name: "Hotel",
    description: "Check in, ask about your room, and solve small problems during your stay.",
    progress: 0,
    wordCount: 21,
    lessonCount: 4,
    status: "locked",
    icon: "bed-double",
    accent: "slate"
  },
  {
    id: "restaurant",
    order: 6,
    name: "Restaurant",
    description: "Read a simple menu, order politely, and talk about what you like to eat.",
    progress: 0,
    wordCount: 26,
    lessonCount: 5,
    status: "locked",
    icon: "utensils",
    accent: "slate"
  }
];

export const mockLessons = {
  introduction: [
    {
      id: "introduction-1",
      number: 1,
      title: "What is your name?",
      words: ["名字", "姓", "叫", "英文名字", "來自"],
      progress: 100,
      minutes: 4,
      status: "completed"
    },
    {
      id: "introduction-2",
      number: 2,
      title: "Where are you from?",
      words: ["國家", "城市", "住", "家", "人"],
      progress: 60,
      minutes: 5,
      status: "in_progress"
    },
    {
      id: "introduction-3",
      number: 3,
      title: "Nice to meet you",
      words: ["認識", "高興", "朋友", "第一次"],
      progress: 0,
      minutes: 4,
      status: "available"
    },
    {
      id: "introduction-4",
      number: 4,
      title: "A first conversation",
      words: ["你好", "請問", "謝謝", "再見"],
      progress: 0,
      minutes: 6,
      status: "locked"
    }
  ],
  occupation: [
    { id: "occupation-1", number: 1, title: "Work and study", words: ["工作", "學生", "老師", "公司"], progress: 100, minutes: 4, status: "completed" },
    { id: "occupation-2", number: 2, title: "What do you do?", words: ["做", "上班", "大學", "專業"], progress: 100, minutes: 5, status: "completed" },
    { id: "occupation-3", number: 3, title: "People at work", words: ["同事", "經理", "客人", "團隊"], progress: 100, minutes: 4, status: "completed" },
    { id: "occupation-4", number: 4, title: "A day at work", words: ["開始", "開會", "休息", "下班"], progress: 100, minutes: 5, status: "completed" }
  ],
  traveling: [
    { id: "traveling-1", number: 1, title: "Planning a trip", words: ["旅行", "計畫", "出發", "到達"], progress: 100, minutes: 5, status: "completed" },
    { id: "traveling-2", number: 2, title: "Finding the way", words: ["哪裡", "左邊", "右邊", "直走", "附近"], progress: 55, minutes: 5, status: "in_progress" },
    { id: "traveling-3", number: 3, title: "On the move", words: ["車站", "地圖", "車票", "出口"], progress: 0, minutes: 4, status: "available" },
    { id: "traveling-4", number: 4, title: "Asking for help", words: ["迷路", "幫忙", "怎麼走", "謝謝"], progress: 0, minutes: 5, status: "locked" },
    { id: "traveling-5", number: 5, title: "A day trip", words: ["早上", "景點", "拍照", "回去"], progress: 0, minutes: 6, status: "locked" }
  ],
  airport: [
    { id: "airport-1", number: 1, title: "Checking in", words: ["機場", "護照", "行李", "登機證"], progress: 0, minutes: 5, status: "available" },
    { id: "airport-2", number: 2, title: "At the gate", words: ["登機門", "航班", "延誤", "起飛"], progress: 0, minutes: 5, status: "locked" },
    { id: "airport-3", number: 3, title: "Security check", words: ["安檢", "排隊", "液體", "電腦"], progress: 0, minutes: 4, status: "locked" },
    { id: "airport-4", number: 4, title: "On the plane", words: ["座位", "窗戶", "安全帶", "飲料"], progress: 0, minutes: 5, status: "locked" },
    { id: "airport-5", number: 5, title: "Arrivals", words: ["抵達", "海關", "行李轉盤", "出口"], progress: 0, minutes: 5, status: "locked" }
  ],
  hotel: [
    { id: "hotel-1", number: 1, title: "Checking in", words: ["飯店", "房間", "預訂", "鑰匙"], progress: 0, minutes: 5, status: "locked" },
    { id: "hotel-2", number: 2, title: "Your room", words: ["床", "浴室", "毛巾", "樓層"], progress: 0, minutes: 4, status: "locked" },
    { id: "hotel-3", number: 3, title: "Hotel services", words: ["早餐", "網路", "電梯", "櫃台"], progress: 0, minutes: 5, status: "locked" },
    { id: "hotel-4", number: 4, title: "Solving a problem", words: ["壞了", "太吵", "換房間", "需要"], progress: 0, minutes: 5, status: "locked" }
  ],
  restaurant: [
    { id: "restaurant-1", number: 1, title: "Reading the menu", words: ["餐廳", "菜單", "點菜", "好吃"], progress: 0, minutes: 5, status: "locked" },
    { id: "restaurant-2", number: 2, title: "Ordering politely", words: ["請給我", "一份", "不要", "可以嗎"], progress: 0, minutes: 5, status: "locked" },
    { id: "restaurant-3", number: 3, title: "Taste and preference", words: ["喜歡", "辣", "甜", "鹹", "清淡"], progress: 0, minutes: 5, status: "locked" },
    { id: "restaurant-4", number: 4, title: "At the table", words: ["筷子", "湯匙", "杯子", "水"], progress: 0, minutes: 4, status: "locked" },
    { id: "restaurant-5", number: 5, title: "Paying the bill", words: ["買單", "現金", "信用卡", "發票"], progress: 0, minutes: 5, status: "locked" }
  ]
};

export const lessonPreviewSteps = [
  { id: "word", label: "Word", icon: "languages" },
  { id: "choice", label: "Choose", icon: "list-checks" },
  { id: "match", label: "Match", icon: "rows-3" },
  { id: "order", label: "Order", icon: "list-ordered" },
  { id: "dialogue", label: "Dialogue", icon: "messages-square" },
  { id: "story", label: "Story", icon: "book-open" }
];

export function categoryById(id) {
  return mockCategories.find((category) => category.id === id) || mockCategories[0];
}

export function lessonById(id) {
  return Object.values(mockLessons).flat().find((lesson) => lesson.id === id) || mockLessons.introduction[0];
}
