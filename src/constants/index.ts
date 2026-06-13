import { db } from "@/firebase";
import { User } from "@/types/user";
import { doc, getDoc } from "firebase/firestore";

const filterOptions = ["Discover", "Similar interest", "Online", "New members", "Popular in my area", "Looking to date", "Outside my country"]

const alphabet = [
  {
    letter: "a",
    options: [
      "Art",
      "Art galleries",
      "Atari",
      "Archery",
      "Acapella",
      "Among us",
      "Acai",
      "Anime",
      "Artistic swimming",
      "Athletics",
      "Activism",
      "Aquarium",
      "Achievements",
      "Apex",
    ],
  },
  {
    letter: "b",
    options: [
      "Bollywood",
      "Basketball",
      "Black lives matter",
      "Beach bars",
      "Body pump",
      "Bowling",
      "Body step",
      "Body combat",
      "Binge-watching-Tv-shows",
      "Bicycle racing",
      "Black pink",
      "Body jam",
      "Broadway",
      "BBQ",
      "Board games",
      "Books",
      "Baseball",
      "Bassist",
      "Boxing",
      "Bar chilling",
      "Beach tennis",
    ],
  },
  {
    letter: "c",
    options: [
      "Cooking",
      "Camping",
      "Chess",
      "Cycling",
      "Concerts",
      "Cosplay",
      "Crafts",
      "Climbing",
      "Comedy",
      "Cinema",
      "Coding",
      "Calligraphy",
      "Cats",
      "Coffee",
      "Crochet",
      "Card games",
      "Cocktails",
      "Capoeira",
      "Car racing",
      "Charity work",
      "Cartooning",
      "Cheerleading",
    ],
  },
  {
    letter: "d",
    options: [
      "Dancing",
      "Dogs",
      "Drawing",
      "Diving",
      "DIY",
      "Drama",
      "Debates",
      "Darts",
      "DJing",
      "Disney",
      "Drama",
      "Dodgeball",
      "Dinosaurs",
      "Desserts",
      "Documentaries",
      "Digital art",
      "Dungeons & Dragons",
    ],
  },
  {
    letter: "e",
    options: [
      "Electronics",
      "Equestrian sports",
      "Escape rooms",
      "Esports",
      "Experimental music",
      "Exhibitions",
      "Eating out",
      "Egg painting",
      "Environmental conservation",
      "Engineering",
      "Entrepreneurship",
      "Exercise",
      "Egyptology",
      "Ethnography",
      "Entomology",
      "Engraving",
      "Eating competitions",
      "Ethical fashion",
      "Economics",
      "Education",
      "Event planning",
    ],
  },
  {
    letter: "f",
    options: [
      "Fashion",
      "Fishing",
      "Football",
      "Festivals",
      "Fitness",
      "Fine arts",
      "Fencing",
      "Film making",
      "Food",
      "Freestyle dancing",
      "Fireworks",
      "Fairy tales",
      "Furniture restoration",
      "Fashion design",
      "Fossil hunting",
      "Falconry",
      "Folklore",
      "Flower arranging",
      "Flag football",
      "Forensic science",
      "Fitness training",
    ],
  },
  {
    letter: "g",
    options: [
      "Gardening",
      "Gaming",
      "Golf",
      "Graffiti art",
      "Gymnastics",
      "Geocaching",
      "Glass art",
      "Graphic design",
      "Gastronomy",
      "Gliding",
      "Gaming tournaments",
      "Gangster movies",
      "Gin tasting",
      "Greek mythology",
      "Genealogy",
      "Gardening",
      "Gospel music",
      "Glassblowing",
      "Gym",
      "Gunsmithing",
      "Guitar",
    ],
  },
  {
    letter: "h",
    options: [
      "Hiking",
      "Horseback riding",
      "History",
      "Hockey",
      "Hula hooping",
      "Hunting",
      "Hip hop music",
      "Holography",
      "Handicrafts",
      "Health and fitness",
      "Horror movies",
      "Horse racing",
      "Hang gliding",
      "Hats",
      "Herbalism",
      "Heavy metal music",
      "Home brewing",
      "Hammock camping",
      "Humor",
      "Harmonica",
      "Historical reenactments",
    ],
  },
  {
    letter: "i",
    options: [
      "Ice skating",
      "Illustration",
      "Inline skating",
      "Ice climbing",
      "Inventing",
      "Indie music",
      "Interior design",
      "Ice hockey",
      "Instrument making",
      "Improvisation",
      "Information technology",
      "Investing",
      "Ironman triathlon",
      "Instagramming",
      "Indigenous cultures",
      "Ice fishing",
      "Ice cream tasting",
      "Insect collecting",
      "Italian food",
      "Influencer",
      "Ice carving",
    ],
  },
  {
    letter: "j",
    options: [
      "Jazz music",
      "Jewelry making",
      "Jogging",
      "Judo",
      "Juggling",
      "Jet skiing",
      "Journaling",
      "Japanese culture",
      "Jazzercise",
      "Juicing",
      "Jump rope",
      "Jamming",
      "Jigsaw puzzles",
      "Jeep riding",
      "Jazz dancing",
      "Jamaican cuisine",
      "Jousting",
      "Japanese anime",
      "Java programming",
      "Jewelry design",
      "Jazzercise",
    ],
  },
  {
    letter: "k",
    options: [
      "Karaoke",
      "Kitesurfing",
      "Kayaking",
      "Kickboxing",
      "Knitting",
      "K-pop music",
      "Karate",
      "Kite flying",
      "Kart racing",
      "Kitchen gardening",
      "Kneeboarding",
      "Knife throwing",
      "Kombucha brewing",
      "Korean dramas",
      "Kites",
      "Kegging beer",
      "Kabuki theater",
      "Kakuro puzzles",
      "Kaleidoscope making",
      "Keno",
      "Knifemaking",
    ],
  },
  {
    letter: "l",
    options: [
      "Listening to music",
      "Lacrosse",
      "Lego building",
      "Laser tag",
      "Languages",
      "LARPing",
      "Laser engraving",
      "Luge",
      "Lindy hop",
      "Live music",
      "Lawn bowling",
      "Leatherworking",
      "Lip sync battles",
      "Literature",
      "Lockpicking",
      "Lawn mowing",
      "Longboarding",
      "Lithography",
      "Line dancing",
      "Luxury cars",
      "Lacquer art",
    ],
  },
  {
    letter: "m",
    options: [
      "Music",
      "Movies",
      "Martial arts",
      "Mountaineering",
      "Museum visits",
      "Magic tricks",
      "Metal detecting",
      "Meditation",
      "Manga",
      "Mountain biking",
      "Mask making",
      "Mosaics",
      "Model building",
      "Mushroom hunting",
      "Mosaics",
      "Mindfulness",
      "Macrame",
      "Molecular gastronomy",
      "Makeup tutorials",
      "Microbrewing",
      "Miniature golf",
    ],
  },
  {
    letter: "n",
    options: [
      "Nature walks",
      "Nordic skiing",
      "Nail art",
      "Nunchaku",
      "Nutrition",
      "Networking",
      "Nordic walking",
      "Novels",
      "Ninjutsu",
      "Numismatics",
      "Nanotechnology",
      "Nudism",
      "Night sky watching",
      "Neon art",
      "Netball",
      "Napping",
      "Naval history",
      "Nerf war",
      "Nautical science",
      "Nihonto",
      "Nylon crafts",
    ],
  },
  {
    letter: "o",
    options: [
      "Origami",
      "Outdoor activities",
      "Orienteering",
      "Opera",
      "Off-roading",
      "Organic gardening",
      "Online gaming",
      "Oxygen therapy",
      "Oud music",
      "Olympic weightlifting",
      "Ornithology",
      "Obstacle courses",
      "Oil painting",
      "Open source projects",
      "Orchestra",
      "Oceans",
      "Oyster shucking",
      "Oboe",
      "Oceanography",
      "Optometry",
      "Ostrich racing",
    ],
  },
  {
    letter: "p",
    options: [
      "Painting",
      "Photography",
      "Piano",
      "Paragliding",
      "Pottery",
      "Parkour",
      "Podcasts",
      "Poetry",
      "Paddleboarding",
      "Philosophy",
      "Pilates",
      "Puppetry",
      "Pasta making",
      "Paranormal investigation",
      "Poker",
      "Pet care",
      "Paddle tennis",
      "Pancake art",
      "Pickleball",
      "Piloting",
      "Paper crafts",
    ],
  },
  {
    letter: "q",
    options: [
      "Quilting",
      "Quizzes",
      "Quad biking",
      "Quidditch",
      "Quilling",
      "Quality time",
      "Quick draw",
      "Qigong",
      "Quadcopter racing",
      "Quilombo",
      "Quantum mechanics",
      "Quests",
      "Quakerism",
      "Qawwali music",
      "Quantum computing",
      "Quartz cutting",
      "Queer culture",
      "Questioning everything",
      "Queen collecting",
      "Quarantine crafts",
      "Quartz",
    ],
  },
  {
    letter: "r",
    options: [
      "Reading",
      "Running",
      "Rowing",
      "Rock climbing",
      "Rugby",
      "Rap music",
      "Racquetball",
      "Robotics",
      "Renaissance art",
      "Radio-controlled cars",
      "Rhythmic gymnastics",
      "Role-playing games",
      "Rope skipping",
      "Rodeo",
      "Renovating",
      "Rubik's cubes",
      "Railroad history",
      "Rain dancing",
      "Racing",
      "Rustic cooking",
      "Retro gaming",
    ],
  },
  {
    letter: "s",
    options: [
      "Swimming",
      "Soccer",
      "Sailing",
      "Scuba diving",
      "Sculpture",
      "Surfing",
      "Skydiving",
      "Skateboarding",
      "Skiing",
      "Snorkeling",
      "Snowboarding",
      "Street art",
      "Stand-up comedy",
      "Spelunking",
      "Samba",
      "Salsa dancing",
      "Squash",
      "Sumo wrestling",
      "Snooker",
      "Spinning",
      "Sewing",
    ],
  },
  {
    letter: "t",
    options: [
      "Traveling",
      "Tennis",
      "Table tennis",
      "Trekking",
      "Tae kwon do",
      "Tap dancing",
      "Trampoline",
      "Triathlons",
      "Trail running",
      "Tarot card reading",
      "Tattooing",
      "Toy collecting",
      "Trombone",
      "Thrift shopping",
      "Tennis table",
      "Twerking",
      "Time travel",
      "Taxidermy",
      "Theater",
      "Tea tasting",
      "Trivia",
    ],
  },
  {
    letter: "u",
    options: [
      "Ultimate Frisbee",
      "Unicycling",
      "Urban exploration",
      "Underwater hockey",
      "Ultimate fighting",
      "Upcycling",
      "Unicycling",
      "Ukulele",
      "Underwater diving",
      "Urban gardening",
      "Urban art",
      "Ufology",
      "Ultimate tournaments",
      "Ultramarathons",
      "Unconventional sports",
      "Upside-down cooking",
      "Umbrella painting",
      "Urban farming",
      "Urban planning",
      "Umbrella crafting",
      "Upholstery",
    ],
  },
  {
    letter: "v",
    options: [
      "Video games",
      "Volleyball",
      "Vlogging",
      "Violin",
      "Vegetarian cooking",
      "Virtual reality",
      "Vibraphone",
      "Vinyl records",
      "Volleyball",
      "Voice acting",
      "Veganism",
      "Vineyard tours",
      "Venture capitalism",
      "Virtual pet breeding",
      "Vinyl cutting",
      "Ventriloquism",
      "Viking history",
      "Victorian fashion",
      "Vehicle restoration",
      "Valentine's crafts",
      "Vikings",
    ],
  },
  {
    letter: "w",
    options: [
      "Writing",
      "Wrestling",
      "Water skiing",
      "Windsurfing",
      "Woodworking",
      "Whale watching",
      "Wine tasting",
      "Waltz",
      "Wildlife photography",
      "Wingsuit flying",
      "Wine making",
      "Wind chime making",
      "Weaving",
      "Wine collecting",
      "Wushu",
      "Whittling",
      "Witchcraft",
      "Web development",
      "Wood carving",
      "Water polo",
      "Whiskey tasting",
    ],
  },
  {
    letter: "x",
    options: [
      "Xylophone playing",
      "X-ray photography",
      "X-treme sports",
      "Xenology",
      "Xerography",
      "Xenotransplantation",
      "Xylitol production",
      "Xiangqi",
      "Xenodochy",
      "Xanadu appreciation",
      "Xanthan gum making",
      "Xiphoidectomy",
      "Xebec racing",
      "Xenobiotics study",
      "Xylography",
      "Xyster sharpening",
      "Xenogenesis",
      "Xenophobia",
      "Xerothermism",
      "Xiphos design",
      "Xiphias hunting",
    ],
  },
  {
    letter: "y",
    options: [
      "Yoga",
      "Yo-yoing",
      "Yachting",
      "Yarn spinning",
      "Youth mentoring",
      "Yoiking",
      "Yard games",
      "Yodeling",
      "Yachting",
      "Yarning",
      "Yarn bombing",
      "Yantra painting",
      "Yummy cooking",
      "Yukigassen",
      "Yachting",
      "Yarning",
      "Yard work",
      "Yachting",
      "Yodelling",
      "Yoyos",
      "Yodelling",
    ],
  },
  {
    letter: "z",
    options: [
      "Zumba",
      "Ziplining",
      "Zither playing",
      "Zorbing",
      "Zen meditation",
      "Zeppelin flying",
      "Zookeeping",
      "Zazen",
      "Zombie hunting",
      "Zamboni driving",
      "Zoo visits",
      "Zither making",
      "Zoetrope animation",
      "Zither crafting",
      "Zumba classes",
      "Zebrafish breeding",
      "Zipline photography",
      "Zebu raising",
      "Zinc mining",
      "Zebu wrestling",
      "Zumba fitness",
    ],
  },
];

const relationship_preferences = [
  {
    image: "/assets/images/onboarding/onboarding-wine.svg",
    title: "Looking to date",
    desc: "Seeking casual dating experience.",
  },
  {
    image: "/assets/images/onboarding/onboarding-heart.svg",
    title: "Chatting and connecting",
    desc: "Open to conversations and getting to know new people.",
  },
  {
    image: "/assets/images/onboarding/onboarding-commitment.svg",
    title: "Ready for commitment",
    desc: "For those who are looking for a serious, committed relationship.",
  },
  {
    image: "/assets/images/onboarding/onboarding-fun.svg",
    title: "Just for fun",
    desc: "Seeking fun and carefree connections without long-term plans.",
  },
  {
    image: "/assets/images/onboarding/onboarding-explore.svg",
    title: "Undecided or exploring",
    desc: "Not sure what you’re looking for? Discover what feels right for you.",
  },
];

const meet = [
  {
    image: "/assets/images/onboarding/men.svg",
    title: "I want to meet men",
    // desc: "Seeking casual dating experience.",
  },
  {
    image: "/assets/images/onboarding/women.svg",
    title: "I want to meet women",
    // desc: "Open to conversations and getting to know new people.",
  },
  {
    image: "/assets/images/onboarding/everyone.svg",
    title: "I want to meet everyone",
    // desc: "For those who are looking for a serious, committed relationship.",
  },
];

const drinking = [
  "Mindful drinking",
  "100% Sober",
  "Special moment only",
  "Regular night out",
];

const pets = [
  "🐕 Dog",
  "🐈 Cat",
  "🐍 Reptile",
  "🐸 Amphibian",
  "🦜 Bird",
  "🐟 Fish",
  "😩  Don't like pets",
  "🐇 Rabbits",
  "🐀 Mouse",
  "😉 Planning on getting",
  "🤮 Allergic",
  "🐎 Other",
  "🙃 Want a pet",
];

const smoking = [
  "Working on quitting",
  "Drinks and smoke",
  "Occasional smoker",
  "Frequent smoker",
  "Not my thing",
];

const workout = [
  "Regularly",
  "Occasionally",
  "Only on weekends",
  "Rarely",
  "Not at all",
];

const marital_status = ["Single", "Taken", "Open"];

const love_language = [
  "Words of Affirmation",
  "Acts of Service",
  "Receiving Gifts",
  "Quality Time",
  "Physical Touch",
];

const zodiac =[
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
]

const family_goal = [
  "I want children",
  "Not sure yet",
  "Not interested for now",
  "I don't want children",
  "I have children",
  "I want more",
]

const religion = [
  "Christianity", 
  "Islam", 
  "Judaism", 
  "Hinduism", 
  "Buddhism", 
  "Sikhism", 
  "Atheism", 
  "Agnosticism", 
  "Other"
];

const communication_style = [
  "Direct and to the point",
  "Friendly and open",
  "Reserved and thoughtful",
  "Humorous and lighthearted",
  "Detailed and descriptive",
]

const preference = [
  "Looking to date",
  "Chatting and connecting",
  "Ready for commitment",
  "Just for fun",
  "Undecided or exploring",
]

const education = ['Not in school', 'Currently Schooling']

const dietary = ['Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Carnivore', 'Omnivore', 'Other']

const countries = [
  { name: "Afghanistan", code: "AF", flag: "🇦🇫" },
  { name: "Albania", code: "AL", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", flag: "🇩🇿" },
  { name: "Andorra", code: "AD", flag: "🇦🇩" },
  { name: "Angola", code: "AO", flag: "🇦🇴" },
  { name: "Antigua and Barbuda", code: "AG", flag: "🇦🇬" },
  { name: "Argentina", code: "AR", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", flag: "🇦🇲" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "Austria", code: "AT", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", flag: "🇧🇸" },
  { name: "Bahrain", code: "BH", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩" },
  { name: "Barbados", code: "BB", flag: "🇧🇧" },
  { name: "Belarus", code: "BY", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", flag: "🇧🇪" },
  { name: "Belize", code: "BZ", flag: "🇧🇿" },
  { name: "Benin", code: "BJ", flag: "🇧🇯" },
  { name: "Bhutan", code: "BT", flag: "🇧🇹" },
  { name: "Bolivia", code: "BO", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", flag: "🇧🇦" },
  { name: "Botswana", code: "BW", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "Brunei", code: "BN", flag: "🇧🇳" },
  { name: "Bulgaria", code: "BG", flag: "🇧🇬" },
  { name: "Burkina Faso", code: "BF", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", flag: "🇧🇮" },
  { name: "Cabo Verde", code: "CV", flag: "🇨🇻" },
  { name: "Cambodia", code: "KH", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", flag: "🇨🇲" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Central African Republic", code: "CF", flag: "🇨🇫" },
  { name: "Chad", code: "TD", flag: "🇹🇩" },
  { name: "Chile", code: "CL", flag: "🇨🇱" },
  { name: "China", code: "CN", flag: "🇨🇳" },
  { name: "Colombia", code: "CO", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", flag: "🇰🇲" },
  { name: "Congo, Democratic Republic of the", code: "CD", flag: "🇨🇩" },
  { name: "Congo, Republic of the", code: "CG", flag: "🇨🇬" },
  { name: "Costa Rica", code: "CR", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", flag: "🇨🇺" },
  { name: "Cyprus", code: "CY", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", flag: "🇩🇰" },
  { name: "Djibouti", code: "DJ", flag: "🇩🇯" },
  { name: "Dominica", code: "DM", flag: "🇩🇲" },
  { name: "Dominican Republic", code: "DO", flag: "🇩🇴" },
  { name: "Ecuador", code: "EC", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", flag: "🇪🇪" },
  { name: "Eswatini", code: "SZ", flag: "🇸🇿" },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹" },
  { name: "Fiji", code: "FJ", flag: "🇫🇯" },
  { name: "Finland", code: "FI", flag: "🇫🇮" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Gabon", code: "GA", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", flag: "🇬🇲" },
  { name: "Georgia", code: "GE", flag: "🇬🇪" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", flag: "🇬🇭" },
  { name: "Greece", code: "GR", flag: "🇬🇷" },
  { name: "Grenada", code: "GD", flag: "🇬🇩" },
  { name: "Guatemala", code: "GT", flag: "🇬🇹" },
  { name: "Guinea", code: "GN", flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "GW", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", flag: "🇭🇹" },
  { name: "Honduras", code: "HN", flag: "🇭🇳" },
  { name: "Hungary", code: "HU", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", flag: "🇮🇸" },
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "Iran", code: "IR", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", flag: "🇮🇪" },
  { name: "Israel", code: "IL", flag: "🇮🇱" },
  { name: "Italy", code: "IT", flag: "🇮🇹" },
  { name: "Jamaica", code: "JM", flag: "🇯🇲" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", flag: "🇰🇪" },
  { name: "Kiribati", code: "KI", flag: "🇰🇮" },
  { name: "Korea, North", code: "KP", flag: "🇰🇵" },
  { name: "Korea, South", code: "KR", flag: "🇰🇷" },
  { name: "Kuwait", code: "KW", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", flag: "🇰🇬" },
  { name: "Laos", code: "LA", flag: "🇱🇦" },
  { name: "Latvia", code: "LV", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", flag: "🇱🇧" },
  { name: "Lesotho", code: "LS", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", flag: "🇱🇷" },
  { name: "Libya", code: "LY", flag: "🇱🇾" },
  { name: "Liechtenstein", code: "LI", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺" },
  { name: "Madagascar", code: "MG", flag: "🇲🇬" },
  { name: "Malawi", code: "MW", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", flag: "🇲🇻" },
  { name: "Mali", code: "ML", flag: "🇲🇱" },
  { name: "Malta", code: "MT", flag: "🇲🇹" },
  { name: "Marshall Islands", code: "MH", flag: "🇲🇭" },
  { name: "Mauritania", code: "MR", flag: "🇲🇷" },
  { name: "Mauritius", code: "MU", flag: "🇲🇺" },
  { name: "Mexico", code: "MX", flag: "🇲🇽" },
  { name: "Micronesia", code: "FM", flag: "🇫🇲" },
  { name: "Moldova", code: "MD", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", flag: "🇲🇳" },
  { name: "Montenegro", code: "ME", flag: "🇲🇪" },
  { name: "Morocco", code: "MA", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", flag: "🇲🇲" },
  { name: "Namibia", code: "NA", flag: "🇳🇦" },
  { name: "Nauru", code: "NR", flag: "🇳🇷" },
  { name: "Nepal", code: "NP", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", flag: "🇳🇮" },
  { name: "Niger", code: "NE", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬" },
  { name: "North Macedonia", code: "MK", flag: "🇲🇰" },
  { name: "Norway", code: "NO", flag: "🇳🇴" },
  { name: "Oman", code: "OM", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰" },
  { name: "Palau", code: "PW", flag: "🇵🇼" },
  { name: "Panama", code: "PA", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "PG", flag: "🇵🇬" },
  { name: "Paraguay", code: "PY", flag: "🇵🇾" },
  { name: "Peru", code: "PE", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", flag: "🇵🇭" },
  { name: "Poland", code: "PL", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", flag: "🇵🇹" },
  { name: "Qatar", code: "QA", flag: "🇶🇦" },
  { name: "Romania", code: "RO", flag: "🇷🇴" },
  { name: "Russia", code: "RU", flag: "🇷🇺" },
  { name: "Rwanda", code: "RW", flag: "🇷🇼" },
  { name: "Saint Kitts and Nevis", code: "KN", flag: "🇰🇳" },
  { name: "Saint Lucia", code: "LC", flag: "🇱🇨" },
  { name: "Saint Vincent and the Grenadines", code: "VC", flag: "🇻🇨" },
  { name: "Samoa", code: "WS", flag: "🇼🇸" },
  { name: "San Marino", code: "SM", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", code: "ST", flag: "🇸🇹" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", flag: "🇷🇸" },
  { name: "Seychelles", code: "SC", flag: "🇸🇨" },
  { name: "Sierra Leone", code: "SL", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "Slovakia", code: "SK", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", flag: "🇸🇮" },
  { name: "Solomon Islands", code: "SB", flag: "🇸🇧" },
  { name: "Somalia", code: "SO", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦" },
  { name: "South Sudan", code: "SS", flag: "🇸🇸" },
  { name: "Spain", code: "ES", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", flag: "🇸🇩" },
  { name: "Suriname", code: "SR", flag: "🇸🇷" },
  { name: "Sweden", code: "SE", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭" },
  { name: "Syria", code: "SY", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", flag: "🇹🇯" },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", flag: "🇹🇭" },
  { name: "Timor-Leste", code: "TL", flag: "🇹🇱" },
  { name: "Togo", code: "TG", flag: "🇹🇬" },
  { name: "Tonga", code: "TO", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", code: "TT", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", flag: "🇹🇲" },
  { name: "Tuvalu", code: "TV", flag: "🇹🇻" },
  { name: "Uganda", code: "UG", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", flag: "🇺🇿" },
  { name: "Vanuatu", code: "VU", flag: "🇻🇺" },
  { name: "Vatican City", code: "VA", flag: "🇻🇦" },
  { name: "Venezuela", code: "VE", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳" },
  { name: "Yemen", code: "YE", flag: "🇾🇪" },
  { name: "Zambia", code: "ZM", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", flag: "🇿🇼" }
];

// const uploadImage = (file: File) => {
//   if (!file) return;

//   //Get Storage from firebase
//   const storage = getStorage();
//   const storageRef = ref(
//     storage,
//     `users/userId/profile_pictures/${file.name}}`
//   );
//   uploadBytes(storageRef, file)
//     .then(() => {
//       toast.success("Image has been uploaded successfully 🚀");
//       console.log("File was uploaded was successfully!");
//       getDownloadURL(storageRef)
//         .then((url) => {
//           // `url` is the download URL for 'images/stars.jpg'

//           // This can be downloaded directly:
//           const xhr = new XMLHttpRequest();
//           xhr.responseType = "blob";
//           xhr.onload = (event) => {
//             const blob = xhr.response;
//           };
//           xhr.open("GET", url);
//           xhr.send();

//           // Or inserted into an <img> element
//           // const img = document.getElementById("myimg");
//           // img.setAttribute("src", url);
//         })
//         .catch((error) => {
//           // Handle any errors
//         });
//     })
//     .catch((err) => console.log(err));
// };

const getTime = (timestamp: {seconds: number, nanoseconds: number}) =>  {
  const seconds = timestamp.seconds;
  const date = new Date(seconds * 1000); // Convert seconds to milliseconds

  const hours = date.getUTCHours(); // Get hours in UTC
  const minutes = date.getUTCMinutes(); // Get minutes in UTC

  // Format hours and minutes to always show two digits
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}`;
}

const formatTime12Hour = (isoString: string) => {
  const date = new Date(isoString);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format, 12 being special case for midnight/noon
  return `${hours}:${minutes} ${ampm}`;
};

function formatFirebaseTimestampToTime({ seconds, nanoseconds }: { seconds: number, nanoseconds: number }): string {
  // Convert seconds to a Date object
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);

  // Extract hours and minutes
  let hours = date.getHours();
  const minutes = date.getMinutes();

  // Determine AM or PM
  const amOrPm = hours >= 12 ? 'PM' : 'AM';

  // Convert 24-hour format to 12-hour format
  hours = hours % 12 || 12; // Convert 0 (midnight) or 12 (noon) to 12

  // Pad minutes with a leading zero if necessary
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  // Return the formatted time string (e.g., 3:40 PM)
  return `${hours}:${formattedMinutes} ${amOrPm}`;
}

function formatFirebaseTimestampToDate({ seconds, nanoseconds }: { seconds: number, nanoseconds: number }): string {
  // Convert seconds to a Date object
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);

  // Extract the day, month, and year
  const day = date.getDate();
  const year = date.getFullYear();

  // Array of month names
  const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];

  // Determine the day suffix (st, nd, rd, th)
  const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                 (day % 10 === 2 && day !== 12) ? 'nd' :
                 (day % 10 === 3 && day !== 13) ? 'rd' : 'th';

  // Return the formatted date string
  return `${day}${suffix} ${month}, ${year}`;
}

const getUserDetails = async (user: string) => {
  const userRef = doc(db, "users", user);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data();
  } else {
    console.log("No such user exists!");
  }
}

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const day = date.getDate().toString(); // Get the day
  const month = (date.getMonth() + 1).toString(); // Get the month (0-indexed, so +1)
  const year = date.getFullYear().toString(); // Get the full year
  return `${day}/${month}/${year}`; // Return formatted as "day/month/year"
};

const formatServerTimeStamps = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Get hours, minutes, and AM/PM format
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const formattedTime = `${hours % 12 || 12}:${minutes}${ampm}`;

  // One day in milliseconds (used for yesterday comparison)
  const oneDay = 24 * 60 * 60 * 1000;

  // If the date is today
  if (date.toDateString() === now.toDateString()) {
      return `${formattedTime}, today`;
  }

  // If the date is yesterday
  const yesterday = new Date(now.getTime() - oneDay);
  if (date.toDateString() === yesterday.toDateString()) {
      return `${formattedTime}, yesterday`;
  }

  // If not today or yesterday, return the formatted date as dd/mm/yyyy
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${formattedTime}, ${day}/${month}/${year}`;
};


const checkUserProfileCompletion = (userData: User) => {
  const propertiesToCheck = [
    userData.first_name,        // 1 First name
    userData.last_name,         // 2 Last name
    userData.gender,            // 3 Gender
    userData.phone_number,      // 4 Phonenumber
    userData.interests,         // 5 Interests
    userData.education,         // 6 Education
    userData.preference,        // 7 Relationship Goals (preference)
    userData.love_language,     // 8 Love language
    userData.zodiac,            // 9 Zodiac
    userData.family_goal,       // 10 Future family plans (family_goal)
    userData.height,            // 11 Height
    userData.weight,            // 12 Weight
    userData.religion,          // 13 Religion
    userData.smoke,             // 14 Smoker (smoke)
    userData.drink,             // 15 Drinking (drink)
    userData.workout,           // 16 Workout
    userData.pets,              // 17 Petowner (pets)
    userData.marital_status,    // 18 Marital status
    userData.bio,               // 19 About me (bio)
  ];

  // Function to check if a value is filled (non-null, non-empty)
  const isFilled = (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0; // Check if array is not empty
    return value !== null && value !== undefined && value !== ""; // Check for non-null, non-undefined, and non-empty string
  };

  // Count the number of filled properties
  const filledCount = propertiesToCheck.filter(isFilled).length;
  return filledCount; };

const cmToFeetAndInches = (cm: number) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`; }

const kilogramsToPounds = (kg: number) => {
  const lbs = kg * 2.20462;
  return lbs.toFixed(2); }

const getFormattedDateFromFirebaseDate = (firebaseDate: { nanoseconds: number, seconds: number } | undefined): string => {
  if (!firebaseDate || typeof firebaseDate.seconds !== 'number') {
    throw new Error('Invalid Firebase date object');
  }

  // Convert seconds to milliseconds
  const milliseconds = firebaseDate.seconds * 1000;

  // Create a Date object
  const date = new Date(milliseconds);

  // Format the date
  const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return formatter.format(date);
};

const addCommasToNumber = (number: number) => {
  return new Intl.NumberFormat().format(number);
};

export {
  alphabet,
  dietary,
  drinking,
  meet,
  pets,
  relationship_preferences,
  smoking,
  workout,
  marital_status,
  family_goal, preference, formatServerTimeStamps,
  religion, love_language, zodiac, communication_style, education, countries, getTime, getUserDetails, formatTime12Hour, formatDate, checkUserProfileCompletion, formatFirebaseTimestampToTime,
  formatFirebaseTimestampToDate, filterOptions, cmToFeetAndInches, getFormattedDateFromFirebaseDate, kilogramsToPounds, addCommasToNumber
};
