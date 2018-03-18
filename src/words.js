// word list
var
  EMPTY_SPACE = "",
  ONE_SPACE = " ",
  WORD_LIST = [
    "balance", "wait", "toss", "beam", "mistake", "valley", "salt", "since",
    "admire", "corner", "hungry", "couch", "trail", "land", "capture", "throat",
    "affection", "coffee", "tired", "dusty", "nation", "limb", "cast", "maybe",
    "warmth", "fantasy", "tool", "bar", "built", "alive", "beauty", "former",
    "dim", "size", "odd", "giant", "mama", "reach", "there", "brand",
    "dog", "soothe", "anyone", "dwell", "count", "blossom", "math", "milk",
    "waste", "nothing", "lung", "hurt", "pale", "silently", "apologize", "yesterday",
    "flight", "strong", "work", "melt", "home", "walk", "rough", "tumble",
    "tiny", "situation", "roam", "scatter", "fright", "mourn", "job", "kept",
    "heavy", "needle", "creak", "suit", "await", "slam", "truck", "spirit",
    "lovely", "thigh", "clock", "another", "survive", "quit", "although", "already",
    "remain", "purple", "foe", "flirt", "plastic", "violence", "alas", "prepare",
    "forgotten", "cloud", "name", "health", "somebody", "dude", "perfect", "afraid",
    "thorn", "image", "rise", "idiot", "bought", "blood", "made", "defeat",
    "turn", "crime", "add", "been", "moment", "dumb", "great", "important",
    "battle", "crack", "ode", "such", "someone", "crave", "serious", "social",
    "pray", "lift", "wrote", "object", "sound", "over", "apple", "distant",
    "praise", "price", "nowhere", "sure", "master", "dragon", "freely", "fruit",
    "prefer", "speak", "mouth", "middle", "doom", "hope", "play", "weak",
    "red", "relax", "devil", "admit", "depression", "gift", "exist", "between",
    "reflection", "savior", "here", "remember", "angry", "honor", "grey", "sick",
    "decay", "woman", "misery", "throw", "speed", "cheer", "beneath", "cream",
    "cup", "meant", "everyone", "upset", "heel", "creature", "drama", "cell",
    "pink", "utter", "pool", "soon", "build", "funny", "shook", "swing",
    "strange", "precious", "inside", "foot", "appear", "float", "attention", "view",
    "listen", "fold", "mutter", "someday", "return", "tight", "forgot", "push",
    "king", "gaze", "own", "diamond", "driver", "embrace", "worship", "soar",
    "warrior", "together", "pen", "sort", "history", "thank", "impossible", "lip",
    "wound", "fur", "numb", "pack", "came", "poet", "love", "mystery",
    "blanket", "garden", "duck", "harsh", "bring", "moon", "even", "pile",
    "cheap", "team", "mold", "pleasure", "first", "taste", "compare", "stole",
    "judge", "settle", "tuck", "glass", "relationship", "during", "bound", "tower",
    "hunger", "drove", "give", "slowly", "shelter", "fan", "week", "tremble",
    "ugly", "beside", "hang", "double", "boyfriend", "handle", "find", "date",
    "heartbeat", "freak", "revenge", "leave", "said", "bounce", "teeth", "selfish",
    "weird", "warn", "feather", "park", "sat", "football", "fully", "mumble",
    "grab", "early", "several", "mud", "happiness", "faith", "glove", "number",
    "sail", "bitter", "bullet", "offer", "lifeless", "sway", "creation", "dust",
    "suppose", "uncle", "process", "sharp", "again", "sky", "bit", "straight",
    "husband", "real", "horizon", "fish", "respond", "total", "reality", "everything",
    "night", "brave", "raise", "especially", "field", "carve", "eternity", "write",
    "dress", "frighten", "free", "dear", "college", "curl", "twirl", "beg",
    "twist", "smart", "myself", "death", "rip", "lazy", "harm", "silly",
    "butterfly", "determine", "smooth", "enter", "ask", "damn", "test", "choose",
    "belong", "puff", "mercy", "climb", "truly", "acid", "terrible", "boat",
    "companion", "evening", "sting", "coat", "path", "hit", "month", "kitchen",
    "begin", "amaze", "delicate", "choke", "possibly", "completely", "cool", "void",
    "vast", "darling", "quickly", "mine", "rose", "gain", "seek", "still",
    "become", "shut", "whatever", "interest", "finger", "confuse", "sweet", "aim",
    "scream", "hey", "afternoon", "led", "easy", "sister", "bid", "youth",
    "stretch", "anyway", "yearn", "princess", "began", "greet", "calm", "hunt",
    "pride", "thrown", "glance", "fix", "follow", "strike", "blue", "flower",
    "shy", "circle", "thick", "drag", "kid", "spine", "neck", "cute",
    "random", "nice", "cigarette", "ancient", "scar", "black", "swell", "pour",
    "guitar", "grant", "ashamed", "coward", "sorry", "flip", "create", "trip",
    "phone", "empty", "tree", "nervous", "eventually", "strain", "country", "glare",
    "good", "nod", "quite", "yard", "expect", "future", "grief", "limit",
    "fear", "cousin", "bowl", "courage", "church", "connect", "deeply", "grin",
    "orange", "shiny", "cry", "normal", "pretend", "grandma", "chance", "bang",
    "moan", "hair", "veil", "unknown", "threaten", "art", "forgive", "through",
    "busy", "search", "mind", "deadly", "mighty", "accept", "rare", "cold",
    "clearly", "natural", "hundred", "darkness", "couple", "able", "sword", "foul",
    "alone", "like", "planet", "ahead", "muse", "attack", "few", "card",
    "gentle", "crawl", "sanity", "depth", "puzzle", "suffocate", "talk", "royal",
    "effort", "drift", "pity", "hill", "belief", "gasp", "feast", "happy",
    "need", "mix", "tie", "along", "drum", "crystal", "agony", "left",
    "floor", "ghost", "voice", "sane", "near", "dance", "guilt", "birth",
    "catch", "desire", "road", "held", "before", "stir", "shoot", "alter",
    "belly", "bottle", "mock", "creep", "sunset", "instead", "thought", "leap",
    "bone", "inch", "nose", "terror", "body", "aunt", "eternal", "music",
    "clear", "pocket", "true", "weapon", "learn", "mere", "back", "indeed",
    "shock", "visit", "really", "tell", "march", "toe", "asleep", "murder",
    "suspend", "touch", "mostly", "smoke", "serve", "bridge", "probably", "character",
    "stream", "put", "hatred", "torture", "beautiful", "help", "press", "five",
    "annoy", "pull", "teach", "kick", "final", "squeeze", "power", "plain",
    "use", "wolf", "shoe", "anger", "screen", "sheet", "grow", "knock",
    "remind", "crap", "mend", "opposite", "wood", "lady", "dart", "victim",
    "volume", "lace", "scent", "pants", "street", "proud", "journey", "wrist",
    "start", "drop", "plate", "connection", "deserve", "those", "baby", "door",
    "white", "passion", "stair", "once", "plant", "certain", "worthless", "dark",
    "peach", "hello", "mirror", "fog", "trickle", "pound", "shift", "stress",
    "holy", "shove", "aside", "sea", "close", "tongue", "example", "flicker",
    "rather", "core", "glide", "define", "into", "comfort", "grass", "two",
    "teacher", "neither", "rhythm", "guide", "rant", "sorrow", "bless", "monster",
    "blank", "release", "mountain", "paper", "six", "everytime", "jealous", "order",
    "scene", "retreat", "confidence", "adore", "taken", "brush", "control", "clay",
    "chair", "simply", "branch", "struggle", "echo", "possess", "suffer", "beyond",
    "awe", "jump", "sneak", "heal", "girl", "shame", "tomorrow", "cheek",
    "stand", "purpose", "bite", "peer", "twice", "stage", "morning", "powerful",
    "sigh", "dot", "due", "memory", "underneath", "hollow", "cost", "metal",
    "within", "awaken", "sudden", "common", "essence", "human", "discover", "loud",
    "hallway", "emotion", "ship", "flare", "usually", "howl", "dawn", "seven",
    "linger", "yourself", "arrive", "mean", "student", "naked", "dry", "string",
    "bother", "queen", "any", "somewhere", "reflect", "given", "square", "clothes",
    "moral", "prove", "poor", "school", "upon", "please", "chocolate", "snap",
    "caress", "blow", "protect", "away", "cover", "steady", "soak", "worry",
    "repeat", "frost", "silent", "prayer", "gas", "thunder", "make", "pie",
    "skin", "parent", "should", "collect", "except", "message", "brother", "throne",
    "brain", "obviously", "rope", "claw", "very", "danger", "spread", "much",
    "house", "skip", "disappear", "hour", "look", "also", "taint", "slight",
    "bright", "present", "escape", "young", "action", "fly", "draw", "surely",
    "line", "drug", "arrow", "beaten", "despite", "ignore", "more", "respect",
    "show", "marry", "shore", "past", "window", "blend", "answer", "warm",
    "river", "tangle", "almost", "motion", "save", "beard", "half", "choice",
    "unable", "understand", "secret", "descend", "son", "trouble", "certainly", "avoid",
    "apart", "pattern", "either", "shimmer", "curse", "seem", "cling", "spin",
    "drink", "direction", "stock", "age", "glory", "sunlight", "dew", "knee",
    "wander", "illuminate", "stone", "cruel", "father", "grasp", "remove", "game",
    "spring", "bank", "tide", "chin", "lunch", "dreamer", "flag", "less",
    "endless", "loser", "commit", "flat", "cease", "hardly", "strip", "hum",
    "suicide", "attempt", "poison", "nerve", "pass", "lead", "reply", "grown",
    "slice", "grand", "grip", "slept", "depend", "everywhere", "peel", "outside",
    "awkward", "rush", "reason", "okay", "scratch", "shall", "keep", "stop",
    "everybody", "anymore", "hospital", "stare", "burn", "army", "shirt", "fresh",
    "surround", "pause", "bathroom", "against", "want", "punch", "noise", "run",
    "government", "three", "box", "bleed", "ice", "ceiling", "chain", "note",
    "slightly", "caught", "monkey", "somehow", "steal", "practice", "careful", "wrinkle",
    "unlike", "try", "win", "blush", "about", "hurry", "huge", "surprise",
    "lightning", "strife", "drunk", "poetry", "excuse", "vision", "silence", "pure",
    "twenty", "further", "swim", "wish", "concrete", "forth", "frown", "enough",
    "god", "travel", "treat", "became", "desert", "second", "whenever", "embarrass",
    "broke", "haunt", "girlfriend", "thousand", "raw", "patient", "leg", "pop",
    "off", "wow", "around", "glad", "book", "carefully", "just", "express",
    "cause", "split", "velvet", "shiver", "scary", "difference", "imagination", "finish",
    "breathe", "wonderful", "ripple", "loss", "notice", "picture", "promise", "leaf",
    "wrong", "stab", "thump", "unseen", "spot", "pay", "hurl", "too",
    "stomach", "complete", "doubt", "something", "crush", "sheep", "stood", "whisper",
    "grace", "men", "recall", "table", "sob", "evil", "tickle", "poem",
    "sent", "sign", "tea", "flesh", "wipe", "shadow", "tap", "dread",
    "familiar", "blink", "autumn", "hide", "thread", "lust", "talent", "storm",
    "story", "prince", "class", "mom", "physical", "shout", "rude", "roar",
    "universe", "click", "worth", "wonder", "sentence", "state", "destroy", "guess",
    "city", "after", "decision", "nobody", "feet", "consume", "blur", "crimson",
    "realize", "guy", "lot", "meet", "mist", "animal", "special", "color",
    "task", "rub", "distance", "lesson", "block", "however", "cheat", "rhyme",
    "regret", "treasure", "jock", "cookie", "gotta", "bus", "allow", "accident",
    "dove", "style", "nightmare", "depress", "collapse", "dinner", "anywhere", "pretty",
    "forever", "boom", "people", "laid", "shown", "bond", "complain", "quiet",
    "ring", "ash", "concern", "deal", "fragile", "goose", "innocence", "erase",
    "toward", "stuff", "green", "breeze", "lord", "suddenly", "palm", "fault",
    "consider", "peace", "society", "wet", "pig", "mother", "fought", "both",
    "value", "conversation", "eye", "invite", "problem", "fact", "each", "friendship",
    "honey", "button", "jaw", "spoken", "board", "enjoy", "worst", "ready",
    "key", "sometimes", "simple", "skill", "buy", "center", "written", "check",
    "other", "guard", "bury", "soldier", "group", "vein", "grew", "sweat",
    "opinion", "frame", "verse", "crash", "cage", "know", "engine", "confusion",
    "candle", "gently", "delight", "daddy", "take", "won", "tough", "iron",
    "insult", "break", "join", "tender", "advice", "reveal", "under", "continue",
    "content", "chill", "whether", "stupid", "trade", "ever", "lonely", "insane",
    "mask", "lick", "carry", "refuse", "step", "separate", "them", "wash",
    "hug", "person", "dish", "next", "bottom", "smile", "kiss", "spill",
    "exactly", "truth", "nearly", "bench", "generation", "desperately", "bubble", "rest",
    "stick", "breath", "child", "language", "experience", "midnight", "little", "blind",
    "patience", "broken", "itself", "horrible", "canvas", "sink", "forest", "happen",
    "pulse", "cap", "stun", "rabbit", "weep", "shatter", "dream", "finally",
    "dirty", "clean", "nail", "bread", "burden", "swirl", "bedroom", "children",
    "forehead", "mass", "tease", "heard", "roll", "angel", "law", "glorious",
    "forget", "heat", "petal", "melody", "million", "worse", "page", "desperate",
    "subject", "wise", "tonight", "quick", "receive", "crowd", "scrape", "dad",
    "song", "weave", "bomb", "anything", "illusion", "sanctuary", "satisfy", "emptiness",
    "deny", "course", "spider", "hero", "among", "wife", "air", "brown",
    "burst", "fade", "witch", "might", "forward", "edge", "rape", "minute",
    "torment", "salty", "energy", "yeah", "nature", "themselves", "abuse", "pillow",
    "knowledge", "throughout", "replace", "study", "laugh", "earth", "honest", "plan",
    "harmony", "smell", "ink", "pierce", "fairy", "destination", "large", "slide",
    "presence", "weakness", "feed", "sleep", "figure", "gone", "wild", "chest",
    "constant", "jeans", "shape", "stranger", "change", "breast", "kingdom", "always",
    "bold", "trick", "matter", "actually", "constantly", "frustrate", "best", "flow",
    "open", "egg", "laughter", "money", "expression", "front", "describe", "watch",
    "stroke", "fate", "crazy", "dig", "world", "spell", "joke", "observe",
    "faint", "welcome", "trace", "cheese", "shower", "focus", "stumble", "yellow",
    "weary", "muscle", "blame", "blonde", "dull", "softly", "movie", "giggle",
    "tune", "machine", "shield", "family", "horse", "blade", "season", "think",
    "imagine", "steel", "radio", "defense", "space", "freedom", "above", "lucky",
    "waist", "high", "north", "winter", "different", "spend", "liquid", "creek",
    "clutch", "flood", "bee", "gotten", "surface", "party", "entire", "some",
    "position", "root", "measure", "gun", "chase", "stolen", "goodbye", "hand",
    "ignorance", "rebel", "snow", "question", "eager", "war", "bag", "ocean",
    "peaceful", "strength", "stubborn", "bloody", "movement", "down", "loose", "rich",
    "charm", "guilty", "new", "pair", "tightly", "pathetic", "ruin", "point",
    "believe", "act", "never", "threw", "felicity", "decide", "painful", "neighbor",
    "frozen", "heart", "across", "behind", "nine", "false", "swallow", "fire",
    "vain", "mention", "pencil", "wheel", "stuck", "fist", "sympathy", "whistle",
    "stray", "snake", "swear", "screw", "knife", "women", "despair", "explode",
    "spiral", "train", "ground", "ache", "fail", "closet", "doll", "mark",
    "taught", "yours", "deep", "force", "water", "weather", "daily", "explain",
    "pressure", "wrap", "nerd", "crumble", "possible", "footstep", "manage", "joy",
    "inner", "kill", "moonlight", "known", "glow", "only", "ball", "disguise",
    "creator", "sport", "flame", "desk", "better", "bliss", "self", "appreciate",
    "sad", "match", "unless", "wave", "daughter", "out", "soft", "barely",
    "flutter", "idea", "begun", "gather", "childhood", "slap", "trust", "bump",
    "claim", "perhaps", "place", "level", "innocent", "stay", "mess", "flash",
    "drive", "bloom", "town", "then", "whole", "rainbow", "clue", "weight",
    "support", "end", "summer", "enemy", "form", "shade", "shine", "hook",
    "single", "demand", "thing", "gay", "freeze", "many", "hate", "useless",
    "piece", "got", "stain", "rule", "curve", "bruise", "hidden", "inhale",
    "safe", "awake", "company", "ourselves", "dirt", "grade", "wall", "soul",
    "goal", "least", "friend", "ponder", "silver", "drawn", "hopefully", "type",
    "perfection", "paint", "perfectly", "easily", "approach", "quietly", "scale", "magic",
    "doctor", "time", "explore", "juice", "yet", "bird", "sense", "demon",
    "third", "birthday", "sadness", "paradise", "eat", "invisible", "today", "born",
    "hop", "small", "curtain", "rock", "everyday", "yell", "score", "fill",
    "favorite", "long", "cross", "letter", "bare", "existence", "shoulder", "agree",
    "often", "heaven"
  ],
  NUM_WORDS = WORD_LIST.length,
  DOUBLE_NUM = NUM_WORDS * NUM_WORDS,
  // Fisher-Yates (aka Knuth) Shuffle:
  shuffle = function(list) {
    var current = list.length, temp, idx;
    // shuffle
    while (0 !== current) {
      // pick rnd
      idx = Math.floor(Math.random() * current--);
      // swap
      temp = list[current];
      list[current] = list[idx];
      list[idx] = temp;
    }
    return list;
  },
  print = function() {
    var shuffled = shuffle(WORD_LIST);
    console.log(
      shuffled.reduce(function(acc, word, idx, arr) {
        acc.push('"', word, '"')
        if (idx === arr.length - 1) {
          // end
          acc.push("\n");
        } else if ((idx + 1) % 8 === 0) {
          // line
          acc.push(",\n");
        } else {
          acc.push(", ");
        }
        return acc;
      }, []).join(""), shuffled.length
    );
  },
  limit = function(value) {
    return (
      value < 0 
        ? NUM_WORDS + value 
        : value % NUM_WORDS
    );
  },
  hexToWords = function(hexString) {
    var
      result = [],
      len = hexString.length,
      u,v,w,
      x,y,z;
    for (x=0; x<len; x+=8) {
      y = hexString.substr(x, 8);
      z = parseInt(y, 16);
      
      u = (z % NUM_WORDS);
      
      v = (Math.floor(z/NUM_WORDS) + u) % NUM_WORDS;
      
      w = (Math.floor(Math.floor(z/NUM_WORDS)/NUM_WORDS) + v) % NUM_WORDS;
      
      result.push(u,v,w);
    }
    return result.map(function(idx) {
      return WORD_LIST[idx];
    }).join(ONE_SPACE);
  },
  wordsToHex = function(strInput) {
    var
      result = [],
      arWords = strInput.split(ONE_SPACE),
      len = arWords.length,
      first, second, third,
      one, two, three,
      x,y,z;
    for (x=0; x<len; x+=3) {
      first = arWords[x];
      one = WORD_LIST.indexOf(first);
      
      second = arWords[x+1];
      two = WORD_LIST.indexOf(second);
      
      third = arWords[x+2];
      three = WORD_LIST.indexOf(third);
      
      y = one + NUM_WORDS * limit(two - one) + DOUBLE_NUM * limit(three - two);
      
      u = y.toString(16);
      
      v = ("00000000" + u).slice(-8);
      
      result.push(v);
    }
    return result.join(EMPTY_SPACE);
  };

module.exports = {
  "words": WORD_LIST,
  "print": print,
  "hexToWords": hexToWords,
  "wordsToHex": wordsToHex
};