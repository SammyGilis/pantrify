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
MACROS — CRITICAL: You must calculate macros accurately by literally adding up every ingredient one by one using standard nutritional data. Do NOT guess or use round numbers.

STEP 1 — For each ingredient, convert its quantity to grams or standard units, then apply these values:
PROTEINS & MEAT: 100g chicken breast=165cal,31p,0c,3.6f | 100g chicken thigh=209cal,26p,0c,11f | 100g ground beef 80/20=254cal,17p,0c,20f | 100g ground beef 90/10=176cal,20p,0c,10f | 100g salmon=208cal,20p,0c,13f | 100g shrimp=99cal,24p,0c,0.3f | 100g tuna canned=116cal,26p,0c,1f | 100g pork belly=518cal,9p,0c,53f | 100g bacon=541cal,37p,1.4p,42f | 100g tofu firm=76cal,8p,2c,4f | 1 large egg=70cal,6p,0c,5f | 100g lentils cooked=116cal,9p,20c,0.4f | 100g chickpeas cooked=164cal,9p,27c,2.6f | 100g black beans cooked=132cal,9p,24c,0.5f
DAIRY: 100g whole milk=61cal,3.2p,4.8c,3.3f | 100g greek yogurt=59cal,10p,3.6c,0.4f | 100g cheddar=403cal,25p,1.3c,33f | 30g cheddar=121cal,7.5p,0.4c,10f | 100g mozzarella=280cal,28p,3.6c,17f | 30g mozzarella=84cal,8.4p,1.1c,5.1f | 100g parmesan=431cal,38p,4c,29f | 1 tbsp butter=102cal,0.1p,0c,11.5f | 100g cream cheese=342cal,6p,4c,34f | 1 tbsp heavy cream=51cal,0.3p,0.4c,5.5f | 100g sour cream=193cal,2p,4.6c,19f | 100g feta=264cal,14p,4c,21f
GRAINS & CARBS: 100g dry pasta=371cal,13p,74c,1.5f | 100g cooked pasta=158cal,5.8p,31c,0.9f | 100g dry rice=365cal,7p,80c,0.7f | 100g cooked rice=130cal,2.7p,28c,0.3f | 1 slice bread 30g=79cal,2.7p,15c,1f | 100g bread=265cal,9p,49c,3.2f | 100g oats=389cal,17p,66c,7f | 1 medium tortilla 45g=146cal,3.8p,25c,3.5f | 100g quinoa cooked=120cal,4.4p,22c,1.9f | 100g couscous cooked=112cal,3.8p,23c,0.2f | 100g potato=77cal,2p,17c,0.1f | 100g sweet potato=86cal,1.6p,20c,0.1f
PRODUCE: 100g tomato=18cal,0.9p,3.9c,0.2f | 100g spinach=23cal,2.9p,3.6c,0.4f | 100g broccoli=34cal,2.8p,7c,0.4f | 100g bell pepper=31cal,1p,6c,0.3f | 100g zucchini=17cal,1.2p,3.1c,0.3f | 100g mushrooms=22cal,3.1p,3.3c,0.3f | 100g carrot=41cal,0.9p,10c,0.2f | 100g cucumber=15cal,0.7p,3.6c,0.1f | 100g avocado=160cal,2p,9c,15f | 1 medium onion 110g=44cal,1.2p,10c,0.1f | 3 cloves garlic 9g=13cal,0.6p,3c,0f | 100g kale=49cal,4.3p,9c,0.9f | 100g corn=86cal,3.2p,19c,1.2f | 100g peas=81cal,5.4p,14c,0.4f | 1 lemon juice 30ml=8cal,0.1p,2.5c,0f | 100g cabbage=25cal,1.3p,6c,0.1f
OILS & FATS: 1 tbsp olive oil=119cal,0p,0c,13.5f | 1 tbsp vegetable oil=124cal,0p,0c,14f | 1 tbsp sesame oil=120cal,0p,0c,13.6f | 1 tbsp coconut oil=121cal,0p,0c,13.5f
SAUCES & LIQUIDS: 1 tbsp soy sauce=9cal,1.3p,0.8c,0f | 1 tbsp fish sauce=6cal,0.9p,0.6c,0f | 1 tbsp tomato paste=13cal,0.7p,3c,0.1f | 100ml coconut milk=197cal,2p,2.8c,21f | 100ml chicken broth=15cal,1p,1.2c,0.5f | 1 tbsp honey=64cal,0p,17c,0f | 1 tbsp maple syrup=52cal,0p,13c,0f | 1 tbsp sugar=49cal,0p,13c,0f | 1 tbsp brown sugar=52cal,0p,13c,0f | 1 tbsp ketchup=17cal,0.3p,4.6c,0.1f | 1 tbsp mayonnaise=94cal,0.1p,0.1c,10.3f | 1 tbsp tahini=89cal,2.6p,3.2c,8f
NUTS & SEEDS: 30g almonds=173cal,6p,6c,15f | 30g walnuts=196cal,4.6p,4c,19.6f | 1 tbsp peanut butter=94cal,4p,3.1c,8f | 1 tbsp sesame seeds=52cal,1.6p,2.1c,4.5f | 30g cashews=163cal,4.3p,9.3c,13f

STEP 2 — Spices, herbs, salt, pepper, and garnishes = 0 calories (negligible).

STEP 3 — Sum all ingredient calories, protein, carbs, fat. Then divide by number of servings.

STEP 4 — Cross-check: calories must ≈ (protein×4) + (carbs×4) + (fat×9). If off by more than 10%, recalculate.

STEP 5 — Round to nearest whole number. Never use placeholder values like 500cal/30p/40c/15f.`.trim();
