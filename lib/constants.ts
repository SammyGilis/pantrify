export const BANNED_WORDS = [
  'penis','penises','cock','cocks','dick','dicks','prick','pricks',
  'phallus','boner','erection','dong','dongs','schlong','member',
  'johnson','willy','willies','wang','wangs','todger','dingus','love muscle',
  'vagina','vaginas','pussy','pussies','cunt','cunts','vulva','snatch','muff',
  'twat','cooch','cooter','vajayjay','lady parts','bearded clam','beef curtains',
  'axe wound','meat curtains','whisker biscuit','punani','vagin','coochie',
  'testicles','testis','testes','scrotum','nads','gonads','ballsack','cojones',
  'boobs','boob','tits','tit','titties','nipple','nipples','jugs','hooters',
  'knockers','bazongas','fun bags','honkers','ta-tas','chesticles','mammaries',
  'buttocks','anus','sphincter','bunghole','asscrack','taint','perineum',
  'gooch','poop chute','keister','wazoo',
  'cum','semen','jizz','spunk','creampie','queef',
  'blowjob','handjob','rimjob','cumshot','gangbang','orgy','threesome',
  'fisting','double penetration','anal',
];

export const FOOD_WHITELIST = [
  'peanut','peanuts','peanut butter','meatball','meatballs','meat sauce',
  'chicken breast','breast','beef','corned beef','ground beef','roast beef',
  'sausage','sausages','bratwurst','chorizo','frankfurter',
  'nuts','walnuts','chestnuts','coconuts','pine nuts','mixed nuts',
  'almond','almonds','cashews','pistachios','pecans','hazelnuts',
  'rack of lamb','spare ribs','rib rack','bottom round',
  'pickle','pickles','dill pickle','gherkin',
  'knob of butter','knob of ginger',
  'rump steak','rump roast',
  'balls of dough','rice balls','snowballs',
  'stone fruit','clam','clams','clam chowder',
  'hotdog','hot dog','corndog',
  'wood ear mushroom','butt','pork butt','boston butt','butter','buttermilk',
  'farfalle','fanny adams','dong quai','wiener schnitzel','schnitzel',
];

export const INGREDIENT_CATS: Record<string, string> = {
  onion: 'PRODUCE', garlic: 'PRODUCE', tomato: 'PRODUCE', pepper: 'PRODUCE',
  lemon: 'PRODUCE', lime: 'PRODUCE', cucumber: 'PRODUCE', carrot: 'PRODUCE',
  parsley: 'PRODUCE', cilantro: 'PRODUCE', basil: 'PRODUCE', mint: 'PRODUCE',
  ginger: 'PRODUCE', 'bok choy': 'PRODUCE', 'green onion': 'PRODUCE', zucchini: 'PRODUCE',
  egg: 'PROTEIN', chicken: 'MEAT', pork: 'MEAT', beef: 'MEAT',
  tofu: 'PROTEIN', shrimp: 'SEAFOOD', salmon: 'SEAFOOD',
  butter: 'DAIRY', cheese: 'DAIRY', mozzarella: 'DAIRY', cream: 'DAIRY',
  olive: 'PANTRY', oil: 'PANTRY', salt: 'PANTRY',
  cumin: 'PANTRY', paprika: 'PANTRY', cayenne: 'PANTRY', miso: 'PANTRY',
  soy: 'PANTRY', tahini: 'PANTRY', rice: 'PANTRY',
  noodle: 'PANTRY', pasta: 'PANTRY', broth: 'PANTRY',
  coconut: 'PANTRY', curry: 'PANTRY', sugar: 'PANTRY', honey: 'PANTRY',
};

export const SOURCE_ICONS: Record<string, string> = {
  tiktok: '🎵',
  instagram: '📸',
  youtube: '▶️',
  web: '🌐',
};

export const MACRO_PROMPT_RULES = `
MACROS: For each recipe, literally add up every ingredient line by line. Reference values:
1 large egg = 70 cal, 6g protein, 0g carbs, 5g fat.
1 tbsp olive oil = 120 cal, 0g, 0g, 14g fat (always exactly 1 tbsp max).
1 tbsp butter = 102 cal, 0g, 0g, 11.5g fat.
1 tbsp heavy cream = 51 cal, 0.3g protein, 0.4g carbs, 5.5g fat.
100g chicken breast = 165 cal, 31g protein, 0g, 3.6g fat.
100g ground beef 80/20 = 254 cal, 17g protein, 0g, 20g fat.
100g dry pasta = 371 cal, 13g protein, 74g carbs, 1.5g fat.
100g cooked rice = 130 cal, 2.7g protein, 28g carbs, 0.3g fat.
100g potato = 77 cal, 2g protein, 17g carbs, 0.1g fat.
100g bread = 277 cal, 9g protein, 55g carbs, 3g fat.
1 tbsp honey = 64 cal, 0g, 17g carbs, 0g.
1 tbsp sugar = 49 cal, 0g, 13g carbs, 0g.
100g tomato = 18 cal, 0.9g protein, 3.9g carbs, 0.2g fat.
30g mozzarella = 85 cal, 6g protein, 1g carbs, 6g fat.
30g cheddar = 120 cal, 7g protein, 0.4g carbs, 10g fat.
1 tbsp soy sauce = 9 cal, 1.3g protein, 0.8g carbs, 0g.
1 medium onion 110g = 44 cal, 1.2g protein, 10g carbs, 0.1g fat.
After summing, divide by servings. Cross-check: calories ≈ (protein×4)+(carbs×4)+(fat×9). Ingredients with no quantity (salt, pepper, garnish) = 0 calories.`.trim();
