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
  "Yes, regularly",
  "Occasionally",
  "Only on weekends",
  "Regularly",
  "Rarely",
  "Not at all",
];

const marital_status = ["married", "divorced", "not my thing", "player"];

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
  "Chirstianity", "Muslim", "Iraq"
]

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
  family_goal, preference,
  religion, love_language, zodiac, communication_style, education
};
