/* Touch Grass Outdoor Guide. API keys are deliberately never written to localStorage. */
(() => {
  'use strict';

  const STORAGE_KEY = 'touchGrassWebsite.v1';
  const BINGO_KEY = 'touchGrassBingo.v1';
  const LANGUAGE_KEY = 'touchGrassLanguage.v1';
  const FONT_SCALE_KEY = 'touchGrassFontScale.v1';
  const LANGUAGE_NAMES = { en: 'English', gu: 'Gujarati', hi: 'Hindi' };
  let activeLanguage = ['en', 'gu', 'hi'].includes(localStorage.getItem(LANGUAGE_KEY)) ? localStorage.getItem(LANGUAGE_KEY) : 'en';
  const FONT_LEVELS = [1, 1.15, 1.30, 1.45];
  const storedFontLevel = Number(localStorage.getItem(FONT_SCALE_KEY) ?? 1);
  let fontLevel = Number.isFinite(storedFontLevel) ? Math.max(0, Math.min(FONT_LEVELS.length - 1, storedFontLevel)) : 1;
  const baseFontSizes = new WeakMap();
  const baseLineHeights = new WeakMap();
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  const translations = new Map();
  const translationRows = [
    ['YOUR SPACE','તમારી જગ્યા','आपकी जगह'],['Home','હોમ','होम'],['Live conditions','હાલની પરિસ્થિતિ','मौजूदा स्थितियाँ'],['Plan my outing','મારો બહાર ફરવાનો પ્લાન','बाहर घूमने की योजना'],['Smart forecast','હવામાનની આગાહી','मौसम पूर्वानुमान'],['Nearby parks','નજીકનાં બગીચા','आस-पास के पार्क'],['Nature bingo','નેચર બિંગો','नेचर बिंगो'],['My progress','મારી પ્રગતિ','मेरी प्रगति'],['MORE','વધુ','और'],['About & settings','વિશે અને સેટિંગ્સ','जानकारी और सेटिंग्स'],
    ['A little fresh air goes a long way.','થોડી તાજી હવા પણ ઘણો ફાયદો કરે છે.','थोड़ी ताज़ी हवा भी बहुत फ़ायदा करती है।'],['Your next good moment might be outside.','તમારો આગળનો સારો સમય બહાર હોઈ શકે છે.','आपका अगला अच्छा पल बाहर हो सकता है।'],['Make a plan','પ્લાન બનાવો','योजना बनाएँ'],['Nature explorer','પ્રકૃતિના પ્રવાસી','प्रकृति खोजी'],['Workspace','કાર્યસ્થળ','कार्यस्थल'],['YOUR DAILY DOSE OF OUTDOORS','તમારા દિવસની બહારની મજા','आपके दिन की प्रकृति की खुराक'],['A little more outside.','થોડો વધુ સમય બહાર.','थोड़ा और बाहर।'],['A little more you.','તમારા માટે થોડો વધુ સમય.','अपने लिए थोड़ा और समय।'],['Plan a small escape, discover nearby green spaces, and make room for a better kind of screen time.','થોડો વિરામ લો, નજીકની હરિયાળી શોધો અને સ્ક્રીનથી દૂર સારો સમય માણો.','थोड़ा विराम लें, पास की हरियाली खोजें और स्क्रीन से दूर अच्छा समय बिताएँ।'],['Today','આજે','आज'],["Let's make it a good one",'ચાલો આજનો દિવસ સારો બનાવીએ','आइए आज का दिन अच्छा बनाएँ'],['YOUR OUTDOOR RESET','બહાર તાજગી મેળવવાનો સમય','बाहर नई ताज़गी का समय'],['Less screen.','ઓછી સ્ક્રીન.','कम स्क्रीन।'],['More green.','વધુ હરિયાળી.','ज़्यादा हरियाली।'],['Fresh air, new places, and tiny moments that make the day feel bigger.','તાજી હવા, નવી જગ્યાઓ અને દિવસને ખાસ બનાવતી નાની ક્ષણો.','ताज़ी हवा, नई जगहें और दिन को खास बनाने वाले छोटे पल।'],['Loading local weather','સ્થાનિક હવામાન લોડ થઈ રહ્યું છે','स्थानीय मौसम लोड हो रहा है'],['YOUR REMINDER TO STEP OUTSIDE','બહાર જવાની તમારી યાદ અપાવણી','बाहर जाने की याद दिलाना'],['Check conditions','પરિસ્થિતિ તપાસો','मौसम की स्थिति देखें'],['Weather, air quality & UV','હવામાન, હવાની ગુણવત્તા અને UV','मौसम, वायु गुणवत्ता और UV'],['Get an AI plan','AI પ્લાન મેળવો','AI योजना पाएँ'],['Made for your day','તમારા દિવસ માટે તૈયાર','आपके दिन के लिए'],['Find green spaces','હરિયાળી જગ્યાઓ શોધો','हरी-भरी जगहें खोजें'],['Explore parks nearby','નજીકનાં બગીચા જુઓ','आस-पास के पार्क देखें'],['Play nature bingo','નેચર બિંગો રમો','नेचर बिंगो खेलें'],['Notice more outdoors','બહારની વધુ બાબતો નિહાળો','बाहर की चीज़ों को ध्यान से देखें'],['THE OUTDOOR SNAPSHOT','બહારની હાલની સ્થિતિ','बाहर की मौजूदा स्थिति'],["How's it looking out there?",'બહારની સ્થિતિ કેવી છે?','बाहर का मौसम कैसा है?'],['Full weather report','હવામાનનો સંપૂર્ણ અહેવાલ','मौसम की पूरी जानकारी'],['OUTDOOR SCORE','બહાર જવાનો સ્કોર','बाहर जाने का स्कोर'],['Your go-outside gauge','બહાર જવા માટેનો સૂચકાંક','बाहर जाने का संकेतक'],['out of 100','100માંથી','100 में से'],['Checking conditions','પરિસ્થિતિ તપાસી રહ્યા છીએ','स्थिति जाँची जा रही है'],['Getting current weather for your chosen city.','તમારા પસંદ કરેલા શહેરનું હવામાન મેળવી રહ્યા છીએ.','आपके चुने शहर का मौसम लाया जा रहा है।'],['Find the best time','સૌથી સારો સમય શોધો','सबसे अच्छा समय खोजें'],['Best time depends on local conditions','સ્થાનિક પરિસ્થિતિ મુજબ શ્રેષ્ઠ સમય','सबसे अच्छा समय स्थानीय स्थिति पर निर्भर है'],['Live data','લાઇવ ડેટા','लाइव डेटा'],['RIGHT NOW','અત્યારે','अभी'],['LIVE','લાઇવ','लाइव'],['Temperature','તાપમાન','तापमान'],['Feels like','અનુભવાતું તાપમાન','महसूस होने वाला तापमान'],['Air quality','હવાની ગુણવત્તા','वायु गुणवत्ता'],['Awaiting data','ડેટાની રાહ જોઈ રહ્યા છીએ','डेटा की प्रतीक्षा है'],['UV index','UV સૂચકાંક','UV सूचकांक'],['Humidity','ભેજ','नमी'],['Relative humidity','સાપેક્ષ ભેજ','सापेक्ष नमी'],['Sunrise','સૂર્યોદય','सूर्योदय'],['Sunset','સૂર્યાસ્ત','सूर्यास्त'],['THE NEXT FEW HOURS','આગામી થોડા કલાકો','अगले कुछ घंटे'],["Today's outdoor window",'આજે બહાર જવાનો યોગ્ય સમય','आज बाहर जाने का सही समय'],['Find a comfortable time to step out.','બહાર જવા માટે આરામદાયક સમય શોધો.','बाहर जाने के लिए आरामदायक समय चुनें।'],['Weather data will appear here.','હવામાનની માહિતી અહીં દેખાશે.','मौसम की जानकारी यहाँ दिखाई देगी।'],['Outdoor score','બહાર જવાનો સ્કોર','बाहर जाने का स्कोर'],['Heuristic estimate, not a safety guarantee','અંદાજિત સ્કોર, સલામતીની ખાતરી નહીં','अनुमानित स्कोर, सुरक्षा की गारंटी नहीं'],['YOUR TINY MISSION','તમારું નાનું મિશન','आपका छोटा मिशन'],['Try something simple','કંઈક સરળ અજમાવો','कुछ आसान करके देखें'],['10-MINUTE RESET','10 મિનિટનો વિરામ','10 मिनट का विराम'],['Take the scenic way','સુંદર રસ્તે ચાલો','खूबसूरत रास्ते से चलें'],['Walk without checking your phone. Find one new leaf, one bird sound, and one thing that makes you pause.','ફોન જોયા વગર ચાલો. એક નવું પાન, પક્ષીનો અવાજ અને થોભવા પ્રેરે એવી એક વસ્તુ શોધો.','फोन देखे बिना चलें। एक नया पत्ता, पक्षी की आवाज़ और एक ऐसी चीज़ खोजें जो आपको ठहरने पर मजबूर करे।'],['I did this','મેં આ કર્યું','मैंने यह किया'],['Nature is not a place to visit. It is home.','પ્રકૃતિ માત્ર ફરવાનું સ્થળ નથી, એ આપણું ઘર છે.','प्रकृति केवल घूमने की जगह नहीं, हमारा घर है।'],['CONDITIONS','હવામાનની સ્થિતિ','मौसम की स्थिति'],['WEATHER, AIR & DAYLIGHT','હવામાન, હવા અને દિવસનો પ્રકાશ','मौसम, हवा और दिन का उजाला'],['Know before','જાણો પછી','जानकर'],['you go.','પછી જાઓ.','फिर जाएँ।'],['A quick read of your local conditions, so your outdoor plans feel more thoughtful.','તમારી આસપાસની સ્થિતિ જાણો જેથી બહારનો પ્લાન વધુ સમજદારીથી બનાવી શકો.','अपने आसपास की स्थिति जानें ताकि बाहर जाने की योजना बेहतर हो।'],['Powered by Open-Meteo','Open-Meteo દ્વારા','Open-Meteo द्वारा'],['Loading weather','હવામાન લોડ થઈ રહ્યું છે','मौसम लोड हो रहा है'],['wind','પવન','हवा'],['humidity','ભેજ','नमी'],['rain chance','વરસાદની શક્યતા','बारिश की संभावना'],['AIR QUALITY INDEX','હવાની ગુણવત્તાનો સૂચકાંક','वायु गुणवत्ता सूचकांक'],['US AQI scale. Sensitive groups may need extra care when air quality worsens.','US AQI માપદંડ. હવાની ગુણવત્તા ખરાબ હોય ત્યારે સંવેદનશીલ લોકોએ ખાસ કાળજી રાખવી.','US AQI पैमाना। हवा की गुणवत्ता खराब होने पर संवेदनशील लोगों को अतिरिक्त सावधानी रखनी चाहिए।'],['At higher UV levels, seek shade and use sun protection.','UV વધુ હોય ત્યારે છાંયડો શોધો અને સૂર્યથી બચાવ કરો.','UV अधिक होने पर छाया लें और धूप से बचाव करें।'],['WIND SPEED','પવનની ઝડપ','हवा की गति'],['Current conditions','હાલની પરિસ્થિતિ','मौजूदा स्थिति'],['Wind can affect comfort, cycling, and some outdoor activities.','પવન આરામ, સાયકલ ચલાવવા અને કેટલીક બહારની પ્રવૃત્તિઓને અસર કરી શકે છે.','हवा आराम, साइकिल चलाने और कुछ बाहरी गतिविधियों को प्रभावित कर सकती है।'],['A SMALL SAFETY CHECK','સલામતીની નાની તપાસ','सुरक्षा की छोटी जाँच'],['Check before you leave','નીકળતા પહેલાં તપાસો','निकलने से पहले जाँचें'],['Live conditions and safety notes will show here when data loads.','ડેટા લોડ થયા પછી હવામાન અને સલામતીની સૂચનાઓ અહીં દેખાશે.','डेटा लोड होने पर मौसम और सुरक्षा संबंधी सुझाव यहाँ दिखेंगे।'],['Carry water','પાણી સાથે રાખો','पानी साथ रखें'],['Consider sun protection','સૂર્યથી બચાવનો વિચાર કરો','धूप से बचाव करें'],['Choose a public route','જાહેર રસ્તો પસંદ કરો','सार्वजनिक रास्ता चुनें'],['PLANNER','પ્લાનર','योजना निर्माता'],['A PLAN THAT GETS YOU OUT THERE','તમને બહાર લઈ જાય એવો પ્લાન','आपको बाहर ले जाने वाली योजना'],['Your next little','તમારું આગલું નાનું','आपका अगला छोटा'],['adventure.','સાહસ.','साहस।'],["Tell us how you're feeling and how much time you have. We'll help you make it count.",'તમને કેવું લાગે છે અને કેટલો સમય છે તે જણાવો. અમે એ સમયનો સારો ઉપયોગ કરાવવામાં મદદ કરીશું.','बताएँ कि आप कैसा महसूस कर रहे हैं और आपके पास कितना समय है। हम उसे अच्छा बनाने में मदद करेंगे।'],['Small plans.','નાના પ્લાન.','छोटी योजनाएँ।'],['Good memories.','સારી યાદો.','अच्छी यादें।'],['YOUR PREFERENCES','તમારી પસંદગીઓ','आपकी पसंद'],['Make it yours','તમારા મુજબ બનાવો','इसे अपने अनुसार बनाएँ'],['City or location','શહેર અથવા સ્થળ','शहर या स्थान'],['Activity','પ્રવૃત્તિ','गतिविधि'],['Hiking / Walk','હાઇકિંગ / ચાલવું','हाइकिंग / पैदल चलना'],['Gardening','બાગકામ','बागवानी'],['Bird Watching','પક્ષીઓ નિહાળવા','पक्षी देखना'],['Outdoor Sports','બહારની રમતો','बाहरी खेल'],['Picnic','પિકનિક','पिकनिक'],['Yoga in Nature','પ્રકૃતિમાં યોગ','प्रकृति में योग'],['Cycling','સાયકલ ચલાવવી','साइकिल चलाना'],['Photography Walk','ફોટોગ્રાફી માટે ચાલવું','फोटोग्राफी वॉक'],['Jogging','જોગિંગ','जॉगिंग'],['Current mood','હાલનો મૂડ','अभी का मूड'],['Okay','ઠીક છે','ठीक है'],['Stressed','તણાવમાં','तनाव में'],['Tired','થાકેલા','थके हुए'],['Bored','કંટાળેલા','बोर हो रहे हैं'],['Energetic','ઉત્સાહિત','ऊर्जावान'],['Need a reset','થોડો વિરામ જોઈએ','थोड़ा विराम चाहिए'],['Time available','ઉપલબ્ધ સમય','उपलब्ध समय'],['15 minutes','15 મિનિટ','15 मिनट'],['30 minutes','30 મિનિટ','30 मिनट'],['45 minutes','45 મિનિટ','45 मिनट'],['1 hour','1 કલાક','1 घंटा'],['1.5 hours','1.5 કલાક','1.5 घंटे'],['2 hours','2 કલાક','2 घंटे'],['Fitness level','ફિટનેસનું સ્તર','फिटनेस स्तर'],['Beginner','શરૂઆત કરનાર','शुरुआती'],['Intermediate','મધ્યમ','मध्यम'],['Advanced','અદ્યતન','उन्नत'],['Going with','કોની સાથે જશો','किसके साथ जाएँगे'],['Solo','એકલા','अकेले'],['Friends','મિત્રો','दोस्त'],['Family with kids','બાળકો સાથે પરિવાર','बच्चों के साथ परिवार'],['Club or group','ક્લબ અથવા જૂથ','क्लब या समूह'],["Today's vibe",'આજનો માહોલ','आज का माहौल'],['Relaxing','આરામદાયક','आरामदायक'],['Adventurous','સાહસિક','रोमांचक'],['Social & fun','મિત્રો સાથે મજા','सामाजिक और मज़ेदार'],['Mindful & meditative','ધ્યાન અને શાંતિ','ध्यान और शांति'],['Fitness-focused','ફિટનેસ પર ધ્યાન','फिटनेस पर केंद्रित'],['Using your local conditions','તમારા સ્થાનિક હવામાનનો ઉપયોગ થશે','आपके स्थानीय मौसम का उपयोग होगा'],['Live conditions will be included when available.','ઉપલબ્ધ હશે ત્યારે લાઇવ હવામાન સામેલ થશે.','उपलब्ध होने पर लाइव मौसम शामिल होगा।'],['View','જુઓ','देखें'],['Create my outdoor plan','મારો બહારનો પ્લાન બનાવો','मेरी बाहरी योजना बनाएँ'],['Your preferences stay in this session. Your API key is not saved by this app.','તમારી પસંદગીઓ આ સેશનમાં જ રહે છે. તમારી API કી આ એપ સાચવતી નથી.','आपकी पसंद इसी सत्र में रहती है। यह ऐप आपकी API कुंजी सेव नहीं करती।'],['Open-model assistant','ઓપન-મોડલ સહાયક','ओपन-मॉडल सहायक'],['Flexible AI, your choice','તમારી પસંદગીનું લવચીક AI','आपकी पसंद का लचीला AI'],['Connect a model through OpenRouter for an AI-generated plan. Without a key, the planner still works in demo mode.','AI પ્લાન માટે OpenRouter મારફતે મોડલ જોડો. કી વગર પણ ડેમો પ્લાનર કામ કરશે.','AI योजना के लिए OpenRouter से मॉडल जोड़ें। कुंजी के बिना भी डेमो प्लानर काम करेगा।'],['AI connection settings','AI કનેક્શન સેટિંગ્સ','AI कनेक्शन सेटिंग्स'],['OpenRouter API key','OpenRouter API કી','OpenRouter API कुंजी'],['Free models from open-weight families (verify license)','ઓપન-વેઇટ પરિવારનાં મફત મોડલ (લાઇસન્સ તપાસો)','ओपन-वेट परिवारों के मुफ़्त मॉडल (लाइसेंस जाँचें)'],['Loading model list...','મોડલની યાદી લોડ થઈ રહી છે...','मॉडल सूची लोड हो रही है...'],['Or enter a model ID','અથવા મોડલ ID લખો','या मॉडल ID दर्ज करें'],['Refresh models','મોડલ ફરી લોડ કરો','मॉडल फिर से लोड करें'],['Live availability can change. Check the model card and license before making open-source claims.','મોડલની ઉપલબ્ધતા બદલાઈ શકે છે. ઓપન-સોર્સ કહેતાં પહેલાં મોડલ કાર્ડ અને લાઇસન્સ તપાસો.','मॉडल की उपलब्धता बदल सकती है। ओपन-सोर्स कहने से पहले मॉडल कार्ड और लाइसेंस जाँचें।'],['YOUR PERSONAL OUTDOOR PLAN','તમારો વ્યક્તિગત બહારનો પ્લાન','आपकी व्यक्तिगत बाहरी योजना'],['Your next good moment','તમારી આગળની સારી ક્ષણ','आपका अगला अच्छा पल'],['is waiting outside.','બહાર તમારી રાહ જોઈ રહી છે.','बाहर आपका इंतज़ार कर रहा है।'],['Your plan will appear here with timed steps, what to bring, and a tiny screen-free challenge.','તમારો પ્લાન અહીં સમય પ્રમાણેના પગલાં, સાથે રાખવાની વસ્તુઓ અને સ્ક્રીનથી દૂર રહેવાના નાના પડકાર સાથે દેખાશે.','आपकी योजना यहाँ समय के अनुसार चरणों, ज़रूरी सामान और स्क्रीन से दूर रहने की छोटी चुनौती के साथ दिखेगी।'],['Realistic steps','વાસ્તવિક પગલાં','व्यावहारिक चरण'],['Safety reminders','સલામતીની યાદ અપાવણી','सुरक्षा संबंधी याद दिलाना'],['Screen-free mission','સ્ક્રીન વગરનું મિશન','स्क्रीन-मुक्त मिशन'],['FORECAST','આગાહી','पूर्वानुमान'],['PICK YOUR MOMENT','તમારો યોગ્ય સમય પસંદ કરો','अपना सही समय चुनें'],['Good weather.','સારું હવામાન.','अच्छा मौसम।'],['Better plans.','વધુ સારા પ્લાન.','बेहतर योजनाएँ।'],['Use the next few hours and days to find a comfortable time to be outdoors.','બહાર રહેવા માટે આરામદાયક સમય શોધવા આગામી કલાકો અને દિવસોની આગાહી જુઓ.','बाहर रहने के लिए आरामदायक समय चुनने हेतु अगले घंटों और दिनों का पूर्वानुमान देखें।'],['Local forecast','સ્થાનિક આગાહી','स्थानीय पूर्वानुमान'],['7-day outlook','7 દિવસની આગાહી','7 दिनों का पूर्वानुमान'],['BEST DAY IN FORECAST','આગાહીમાં શ્રેષ્ઠ દિવસ','पूर्वानुमान में सबसे अच्छा दिन'],['Waiting for forecast','આગાહીની રાહ છે','पूर्वानुमान की प्रतीक्षा है'],['BEST REMAINING WINDOW','આગામી શ્રેષ્ઠ સમય','आने वाला सबसे अच्छा समय'],['Based on hourly conditions','કલાકવાર સ્થિતિના આધારે','घंटेवार स्थिति के आधार पर'],['RAIN OUTLOOK','વરસાદની આગાહી','बारिश का पूर्वानुमान'],['Maximum daily chance','દિવસની મહત્તમ શક્યતા','दिन की अधिकतम संभावना'],['7-DAY OVERVIEW','7 દિવસનો સારાંશ','7 दिनों का अवलोकन'],['Temperature outlook','તાપમાનની આગાહી','तापमान का पूर्वानुमान'],['Daily high and low temperatures in your selected city.','તમારા પસંદ કરેલા શહેરનું દૈનિક મહત્તમ અને લઘુત્તમ તાપમાન.','आपके चुने शहर का दैनिक अधिकतम और न्यूनतम तापमान।'],['Live forecast will appear here.','લાઇવ આગાહી અહીં દેખાશે.','लाइव पूर्वानुमान यहाँ दिखेगा।'],['Daily high','દિવસનું મહત્તમ','दैनिक अधिकतम'],['Daily low','દિવસનું લઘુત્તમ','दैनिक न्यूनतम'],['DAY BY DAY','દિવસ પ્રમાણે','दिन के अनुसार'],['Your week outside','બહાર વિતાવવાનું તમારું અઠવાડિયું','बाहर बिताने का आपका सप्ताह'],['Forecasts can change. Check again before leaving.','આગાહી બદલાઈ શકે છે. નીકળતાં પહેલાં ફરી તપાસો.','पूर्वानुमान बदल सकता है। निकलने से पहले फिर जाँचें।'],['Getting the latest 7-day forecast...','નવીનતમ 7 દિવસની આગાહી મેળવી રહ્યા છીએ...','नवीनतम 7-दिन का पूर्वानुमान लाया जा रहा है...'],['A friendly reminder:','એક નમ્ર યાદ અપાવણી:','एक छोटा-सा सुझाव:'],['the Outdoor Score is a simple planning estimate, not an official safety assessment. Follow local advisories and trust your judgement.','બહાર જવાનો સ્કોર માત્ર આયોજન માટેનો અંદાજ છે, સત્તાવાર સલામતી મૂલ્યાંકન નથી. સ્થાનિક સૂચનાઓ અનુસરો અને સમજદારીથી નિર્ણય લો.','बाहर जाने का स्कोर केवल योजना के लिए एक अनुमान है, आधिकारिक सुरक्षा आकलन नहीं। स्थानीय सलाह मानें और समझदारी से निर्णय लें।'],['PARKS','બગીચા','पार्क'],['FIND YOUR PATCH OF GREEN','તમારી હરિયાળી જગ્યા શોધો','अपनी हरियाली वाली जगह खोजें'],['Take the long way','થોડો લાંબો પણ સુંદર રસ્તો લો','थोड़ा लंबा, सुंदर रास्ता चुनें'],['through nature.','પ્રકૃતિની વચ્ચે.','प्रकृति के बीच से।'],['Discover named parks and gardens from OpenStreetMap near your chosen city.','તમારા પસંદ કરેલા શહેરની નજીકનાં બગીચા OpenStreetMap માંથી શોધો.','अपने चुने शहर के पास के पार्क और बगीचे OpenStreetMap से खोजें।'],['Find parks','બગીચા શોધો','पार्क खोजें'],['EXPLORE THE AREA','આસપાસ શોધો','आस-पास देखें'],['Green spaces on the map','નકશા પર હરિયાળી જગ્યાઓ','मानचित्र पर हरियाली वाली जगहें'],['Search to discover parks nearby.','નજીકનાં બગીચા શોધવા સર્ચ કરો.','पास के पार्क खोजने के लिए खोजें।'],['Green spaces','હરિયાળી જગ્યાઓ','हरियाली वाली जगहें'],['Your park map will appear here','તમારો બગીચાનો નકશો અહીં દેખાશે','आपके पार्क का नक्शा यहाँ दिखेगा'],['Search a city to load OpenStreetMap data.','OpenStreetMap ડેટા લોડ કરવા શહેર શોધો.','OpenStreetMap डेटा लोड करने के लिए शहर खोजें।'],['Map tiles © OpenStreetMap contributors','નકશા ટાઇલ્સ © OpenStreetMap યોગદાનકર્તાઓ','मानचित्र टाइलें © OpenStreetMap योगदानकर्ता'],['places found','જગ્યાઓ મળી','जगहें मिलीं'],['NEAR YOU','તમારી નજીક','आपके पास'],['Places to explore','ફરવા જેવી જગ્યાઓ','घूमने की जगहें'],['Nearest first','સૌથી નજીક પહેલાં','सबसे नज़दीक पहले'],['Name A–Z','નામ A–Z','नाम A–Z'],["Let's find some green",'ચાલો હરિયાળી શોધીએ','आइए हरियाली खोजें'],['Enter a city and search to discover nearby parks.','નજીકનાં બગીચા શોધવા શહેર લખીને સર્ચ કરો.','पास के पार्क खोजने के लिए शहर लिखकर खोजें।'],['Park names and locations come from community-maintained OpenStreetMap data. Confirm opening hours, access, and safety locally before travelling.','બગીચાનાં નામ અને સ્થાન OpenStreetMap ના સમુદાય આધારિત ડેટામાંથી આવે છે. જતાં પહેલાં સમય, પ્રવેશ અને સલામતીની સ્થાનિક રીતે ખાતરી કરો.','पार्क के नाम और स्थान समुदाय द्वारा रखे गए OpenStreetMap डेटा से आते हैं। जाने से पहले समय, प्रवेश और सुरक्षा की पुष्टि करें।'],['BINGO','બિંગો','बिंगो'],['LOOK CLOSER. NOTICE MORE.','ધ્યાનથી જુઓ, વધુ જાણો.','ध्यान से देखें, ज़्यादा जानें।'],['Nature is full of','પ્રકૃતિ ભરપૂર છે','प्रकृति भरी है'],['little surprises.','નાનાં આશ્ચર્યોથી.','छोटे-छोटे आश्चर्यों से।'],['Take this bingo card outside. Check off the little things you find, and let curiosity lead the way.','આ બિંગો કાર્ડ બહાર લઈ જાઓ. મળતી નાની બાબતો પર નિશાન કરો અને જિજ્ઞાસાને આગળ વધવા દો.','इस बिंगो कार्ड को बाहर ले जाएँ। जो छोटी चीज़ें मिलें उन्हें चिह्नित करें और जिज्ञासा के साथ आगे बढ़ें।'],['9 things to find','શોધવાની 9 વસ્તુઓ','खोजने के लिए 9 चीज़ें'],['+20 grass points','+20 ગ્રાસ પોઇન્ટ્સ','+20 ग्रास पॉइंट'],['Then put your phone away','પછી ફોન દૂર રાખો','फिर फोन दूर रख दें'],['YOUR NATURE QUEST','તમારો પ્રકૃતિ પડકાર','आपकी प्रकृति चुनौती'],["Today's bingo card",'આજનું બિંગો કાર્ડ','आज का बिंगो कार्ड'],['Every outing is a chance to notice something new.','દરેક બહાર નીકળવું કંઈક નવું નિહાળવાની તક છે.','हर बार बाहर जाना कुछ नया देखने का मौका है।'],['New card','નવું કાર્ડ','नया कार्ड'],['found','મળ્યું','मिला'],['Bingo! You noticed the little things.','બિંગો! તમે નાની બાબતો ધ્યાનથી જોઈ.','बिंगो! आपने छोटी-छोटी चीज़ों पर ध्यान दिया।'],['+20 grass points added to your journey.','તમારી સફરમાં +20 ગ્રાસ પોઇન્ટ્સ ઉમેરાયા.','आपकी यात्रा में +20 ग्रास पॉइंट जुड़ गए।'],['MINDFULNESS TIP','સજાગતાની સલાહ','सजगता के सुझाव'],['Notice with all five senses.','પાંચેય ઇન્દ્રિયો વડે અનુભવો.','पाँचों इंद्रियों से महसूस करें।'],['Look for colour, listen for natural sounds, feel the breeze, and pause long enough to notice what you usually miss.','રંગો જુઓ, પ્રકૃતિના અવાજો સાંભળો, પવન અનુભવો અને સામાન્ય રીતે ચૂકી જતી બાબતો નિહાળવા થોભો.','रंग देखें, प्रकृति की आवाज़ें सुनें, हवा महसूस करें और उन चीज़ों को देखने के लिए रुकें जिन्हें अक्सर नज़रअंदाज़ कर देते हैं।'],['👁️ See','👁️ જુઓ','👁️ देखें'],['👂 Hear','👂 સાંભળો','👂 सुनें'],['🌬️ Feel','🌬️ અનુભવો','🌬️ महसूस करें'],['YOUR REWARD','તમારું ઇનામ','आपका इनाम'],['Grass points','ગ્રાસ પોઇન્ટ્સ','ग्रास पॉइंट'],['Complete all 9 squares to celebrate your nature noticing.','પ્રકૃતિની 9 બાબતો શોધીને તમારો અનુભવ ઉજવો.','प्रकृति की सभी 9 चीज़ें खोजकर अपनी उपलब्धि का जश्न मनाएँ।'],['PROGRESS','પ્રગતિ','प्रगति'],['SMALL STEPS ADD UP','નાનાં પગલાં મોટો ફેરફાર લાવે છે','छोटे कदम बड़ा बदलाव लाते हैं'],['Your outdoor','તમારી બહારની','आपकी बाहरी'],['story so far.','અત્યાર સુધીની સફર.','अब तक की कहानी।'],['Celebrate the time you made for yourself, one outing at a time.','દરેક બહારની પ્રવૃત્તિ સાથે પોતાના માટે કાઢેલા સમયની ઉજવણી કરો.','हर बार बाहर जाकर अपने लिए निकाले समय का जश्न मनाएँ।'],['Export my data','મારો ડેટા એક્સપોર્ટ કરો','मेरा डेटा एक्सपोर्ट करें'],['TOTAL GRASS POINTS','કુલ ગ્રાસ પોઇન્ટ્સ','कुल ग्रास पॉइंट'],['Earned by showing up','ભાગ લેવાથી મેળવ્યા','भाग लेने से मिले'],['CURRENT STREAK','હાલની સતત શ્રેણી','वर्तमान लगातार दिन'],['days','દિવસ','दिन'],['Keep your rhythm going','તમારી નિયમિતતા જાળવો','अपनी नियमितता बनाए रखें'],['TIME OUTSIDE','બહાર વિતાવેલો સમય','बाहर बिताया समय'],['hrs','કલાક','घंटे'],['All logged outings combined','બધી નોંધેલી પ્રવૃત્તિઓનો સરવાળો','सभी दर्ज बाहरी गतिविधियों का कुल'],['OUTINGS COMPLETED','પૂર્ણ કરેલી પ્રવૃત્તિઓ','पूरी की गई बाहरी गतिविधियाँ'],['Moments away from the screen','સ્ક્રીનથી દૂર વિતાવેલી ક્ષણો','स्क्रीन से दूर बिताए पल'],['YOUR WEEK','તમારું અઠવાડિયું','आपका सप्ताह'],['Minutes outdoors','બહાર વિતાવેલી મિનિટો','बाहर बिताए मिनट'],['See how your outdoor time is building up.','બહાર વિતાવેલો સમય કેવી રીતે વધી રહ્યો છે તે જુઓ.','देखें कि बाहर बिताया समय कैसे बढ़ रहा है।'],['Log your first outing to begin your chart.','ચાર્ટ શરૂ કરવા પહેલી પ્રવૃત્તિ નોંધો.','चार्ट शुरू करने के लिए पहली गतिविधि दर्ज करें।'],['Weekly goal','અઠવાડિયાનો લક્ષ્ય','साप्ताहिक लक्ष्य'],['min','મિનિટ','मिनट'],['Goal','લક્ષ્ય','लक्ष्य'],['CHECK IN WITH YOURSELF','પોતાની સાથે જોડાઓ','खुद से जुड़ें'],['Your mood journey','તમારા મૂડની સફર','आपके मूड का सफ़र'],['How you felt before and after an outing.','બહાર જતાં પહેલાં અને પછી કેવું લાગ્યું તે જુઓ.','बाहर जाने से पहले और बाद में कैसा महसूस हुआ, देखें।'],['LAST CHECK-IN','છેલ્લી નોંધ','आख़िरी स्थिति'],['Not logged yet','હજુ નોંધ્યું નથી','अभी दर्ज नहीं किया'],['Finish an outing to record how you feel.','તમારી લાગણી નોંધવા પ્રવૃત્તિ પૂર્ણ કરો.','अपनी भावना दर्ज करने के लिए गतिविधि पूरी करें।'],['No judgement. Just notice how you feel.','કોઈ મૂલ્યાંકન નહીં. ફક્ત પોતાની લાગણી નોંધો.','कोई निर्णय नहीं। बस महसूस करें कि कैसा लग रहा है।'],['LITTLE WINS','નાની સફળતાઓ','छोटी सफलताएँ'],['Achievements','સિદ્ધિઓ','उपलब्धियाँ'],['A reason to feel proud of the small things.','નાની બાબતો માટે ગર્વ અનુભવવાનું કારણ.','छोटी बातों पर गर्व करने की वजह।'],['LOOKING BACK','પાછળ નજર','पीछे मुड़कर देखें'],['Recent outings','તાજેતરની પ્રવૃત્તિઓ','हाल की बाहरी गतिविधियाँ'],['Your most recent logged outdoor moments.','તાજેતરમાં નોંધેલી બહારની ક્ષણો.','हाल में दर्ज बाहरी पलों की सूची।'],['Clear history','ઇતિહાસ સાફ કરો','इतिहास मिटाएँ'],['Your story starts with one step.','તમારી સફર એક પગલાથી શરૂ થાય છે.','आपकी कहानी एक कदम से शुरू होती है।'],['Generate a plan and log your first outing.','પ્લાન બનાવો અને પહેલી બહારની પ્રવૃત્તિ નોંધો.','योजना बनाएँ और पहली बाहरी गतिविधि दर्ज करें।'],['ABOUT','વિશે','जानकारी'],['A SMALL PROJECT WITH A SIMPLE IDEA','સરળ વિચાર સાથેનો નાનો પ્રોજેક્ટ','एक सरल विचार वाला छोटा प्रोजेक्ट'],['Technology that','એવી ટેક્નોલોજી જે','ऐसी तकनीक जो'],['takes you outside.','તમને બહાર લઈ જાય છે.','आपको बाहर ले जाती है।'],['Touch Grass uses helpful technology for one purpose: making the offline world easier to enjoy.','Touch Grass ઉપયોગી ટેક્નોલોજીથી બહારની દુનિયાનો આનંદ માણવાનું સરળ બનાવે છે.','Touch Grass उपयोगी तकनीक से वास्तविक दुनिया का आनंद लेना आसान बनाता है।'],['Live local data','સ્થાનિક લાઇવ ડેટા','स्थानीय लाइव डेटा'],['Weather and air-quality information help you plan around current conditions instead of guessing.','હવામાન અને હવાની ગુણવત્તાની માહિતીથી અંદાજને બદલે યોગ્ય પ્લાન બનાવી શકો છો.','मौसम और हवा की गुणवत्ता की जानकारी से अनुमान के बजाय बेहतर योजना बना सकते हैं।'],['Open-model AI','ઓપન-મોડલ AI','ओपन-मॉडल AI'],['Recommended: Gemma 4 26B A4B Instruct, whose official model card lists Apache 2.0. The app calls the hosted model through OpenRouter; verify the exact model and licence before publishing.','ભલામણ: Gemma 4 26B A4B Instruct. એપ OpenRouter મારફતે હોસ્ટેડ મોડલ વાપરે છે; પ્રકાશિત કરતાં પહેલાં મોડલ અને લાઇસન્સ ચકાસો.','सुझाव: Gemma 4 26B A4B Instruct। ऐप OpenRouter के ज़रिए होस्टेड मॉडल उपयोग करता है; प्रकाशित करने से पहले मॉडल और लाइसेंस जाँचें।'],['Real green spaces','વાસ્તવિક હરિયાળી જગ્યાઓ','वास्तविक हरियाली वाली जगहें'],['Find named parks and gardens from community-maintained map data near your selected city.','તમારા શહેરની નજીકનાં બગીચા સમુદાય દ્વારા સંચાલિત નકશા ડેટામાંથી શોધો.','अपने शहर के पास के पार्क समुदाय द्वारा रखे गए मानचित्र डेटा से खोजें।'],['PERSONALISE YOUR SPACE','તમારી જગ્યા વ્યક્તિગત બનાવો','अपनी जगह को व्यक्तिगत बनाएँ'],['Your profile','તમારી પ્રોફાઇલ','आपकी प्रोफ़ाइल'],['These details are stored in this browser only.','આ વિગતો ફક્ત આ બ્રાઉઝરમાં સંગ્રહાય છે.','ये विवरण केवल इसी ब्राउज़र में रखे जाते हैं।'],['Your display name','તમારું પ્રદર્શિત નામ','आपका दिखने वाला नाम'],['Your default city','તમારું મૂળ શહેર','आपका डिफ़ॉल्ट शहर'],['Weekly outdoor goal','અઠવાડિયાનું બહારનું લક્ષ્ય','साप्ताहिक बाहरी लक्ष्य'],['60 minutes','60 મિનિટ','60 मिनट'],['90 minutes','90 મિનિટ','90 मिनट'],['150 minutes','150 મિનિટ','150 मिनट'],['210 minutes','210 મિનિટ','210 मिनट'],['300 minutes','300 મિનિટ','300 मिनट'],['Save preferences','પસંદગીઓ સાચવો','पसंद सेव करें'],['PRIVACY & TRANSPARENCY','ગોપનીયતા અને પારદર્શિતા','गोपनीयता और पारदर्शिता'],['Your outdoors journey belongs to you.','તમારી બહારની સફર તમારી છે.','आपकी बाहरी यात्रा आपकी है।'],["Profile and progress stay in your browser's local storage.",'પ્રોફાઇલ અને પ્રગતિ તમારા બ્રાઉઝરના લોકલ સ્ટોરેજમાં રહે છે.','प्रोफ़ाइल और प्रगति आपके ब्राउज़र के लोकल स्टोरेज में रहती है।'],['Your OpenRouter API key is sent only with a plan request and is not saved by this app.','તમારી OpenRouter API કી ફક્ત પ્લાનની વિનંતી વખતે મોકલાય છે અને આ એપ તેને સાચવતી નથી.','आपकी OpenRouter API कुंजी केवल योजना अनुरोध के साथ भेजी जाती है और यह ऐप इसे सेव नहीं करती।'],['Weather, map tiles, parks, and AI services require internet.','હવામાન, નકશા, બગીચા અને AI સેવાઓ માટે ઇન્ટરનેટ જરૂરી છે.','मौसम, नक्शे, पार्क और AI सेवाओं के लिए इंटरनेट आवश्यक है।'],["External providers process requests under their own privacy policies.",'બાહ્ય સેવા પ્રદાતાઓ પોતાની ગોપનીયતા નીતિ પ્રમાણે વિનંતીઓ પ્રક્રિયા કરે છે.','बाहरी प्रदाता अपनी गोपनीयता नीतियों के अनुसार अनुरोधों को प्रोसेस करते हैं।'],['Download my local data','મારો સ્થાનિક ડેટા ડાઉનલોડ કરો','मेरा स्थानीय डेटा डाउनलोड करें'],['BUILT FOR THE TOUCH GRASS THEME','Touch Grass વિચાર માટે બનાવ્યું','Touch Grass विचार के लिए बनाया गया'],['Keep the screen part short.','સ્ક્રીનનો સમય ટૂંકો રાખો.','स्क्रीन पर समय कम रखें।'],['Plan quickly, then go enjoy the real world. The AI plan is a suggestion, not a substitute for local safety advice or your own judgement.','ઝડપથી પ્લાન બનાવો અને પછી વાસ્તવિક દુનિયાનો આનંદ માણો. AI પ્લાન માત્ર સૂચન છે, સલામતીની સ્થાનિક સલાહ કે તમારી સમજનો વિકલ્પ નથી.','जल्दी योजना बनाएँ और वास्तविक दुनिया का आनंद लें। AI योजना केवल सुझाव है, स्थानीय सुरक्षा सलाह या आपके विवेक का विकल्प नहीं।'],['GO OUTSIDE. FEEL BETTER.','બહાર જાઓ. સારું અનુભવો.','बाहर जाएँ। बेहतर महसूस करें।'],['Made for a greener tomorrow','વધુ હરિયાળા આવતીકાલ માટે','हरे-भरे कल के लिए'],['v1.0 · Student project','v1.0 · વિદ્યાર્થી પ્રોજેક્ટ','v1.0 · छात्र परियोजना'],
    ['Good','સારી','अच्छी'],['Moderate','મધ્યમ','मध्यम'],['Unhealthy for sensitive groups','સંવેદનશીલ લોકો માટે હાનિકારક','संवेदनशील लोगों के लिए अस्वस्थ'],['Unhealthy','હાનિકારક','अस्वस्थ'],['Very unhealthy','ખૂબ હાનિકારક','बहुत अस्वस्थ'],['Hazardous','જોખમી','खतरनाक'],['Unavailable','ઉપલબ્ધ નથી','उपलब्ध नहीं'],['Low','ઓછું','कम'],['High','વધુ','अधिक'],['Very high','ખૂબ વધુ','बहुत अधिक'],['Extreme','અતિશય','अत्यधिक'],['Clear sky','સ્વચ્છ આકાશ','साफ़ आसमान'],['Mostly clear','મોટેભાગે સ્વચ્છ','अधिकतर साफ़'],['Partly cloudy','થોડાં વાદળો','आंशिक बादल'],['Overcast','વાદળછાયું','बादल छाए हुए'],['Fog','ધુમ્મસ','कोहरा'],['Light drizzle','હળવો ઝરમર વરસાદ','हल्की बूंदाबांदी'],['Drizzle','ઝરમર વરસાદ','बूंदाबांदी'],['Heavy drizzle','ભારે ઝરમર વરસાદ','तेज़ बूंदाबांदी'],['Freezing drizzle','ઠંડી ઝરમર','जमाने वाली बूंदाबांदी'],['Light rain','હળવો વરસાદ','हल्की बारिश'],['Rain','વરસાદ','बारिश'],['Heavy rain','ભારે વરસાદ','तेज़ बारिश'],['Freezing rain','બરફ જેવો ઠંડો વરસાદ','जमने वाली बारिश'],['Light snow','હળવી હિમવર્ષા','हल्की बर्फ़बारी'],['Snow','હિમવર્ષા','बर्फ़बारी'],['Heavy snow','ભારે હિમવર્ષા','भारी बर्फ़बारी'],['Rain showers','ઝાપટાં','बारिश की बौछारें'],['Violent showers','ભારે ઝાપટાં','तेज़ बौछारें'],['Thunderstorm','વાવાઝોડા સાથે વરસાદ','तूफ़ानी बारिश'],['Thunderstorm + hail','કરા સાથે વાવાઝોડું','ओलों के साथ तूफ़ान'],
    ['Demo plan generated locally. Add an OpenRouter key and choose a verified open-weight model to generate an AI plan.','ડેમો પ્લાન સ્થાનિક રીતે બનાવ્યો છે. AI પ્લાન માટે OpenRouter કી ઉમેરો અને ચકાસેલું ઓપન-વેઇટ મોડલ પસંદ કરો.','डेमो योजना स्थानीय रूप से बनाई गई है। AI योजना के लिए OpenRouter कुंजी जोड़ें और सत्यापित ओपन-वेट मॉडल चुनें।'],['The OpenRouter key should normally start with sk-or-. Check the key and try again.','OpenRouter કી સામાન્ય રીતે sk-or- થી શરૂ થાય છે. કી તપાસીને ફરી પ્રયાસ કરો.','OpenRouter कुंजी आमतौर पर sk-or- से शुरू होती है। कुंजी जाँचकर फिर प्रयास करें।'],['Choose a model from the model list first.','પહેલાં મોડલની યાદીમાંથી મોડલ પસંદ કરો.','पहले मॉडल सूची से मॉडल चुनें।'],['For this challenge-ready build, choose a listed :free model from a supported open-weight family. Verify its exact model card and license before submission.','આ વર્ઝનમાં સૂચિમાંથી સપોર્ટેડ ઓપન-વેઇટ પરિવારનું :free મોડલ પસંદ કરો. સબમિટ કરતાં પહેલાં મોડલ કાર્ડ અને લાઇસન્સ તપાસો.','इस संस्करण में सूची से समर्थित ओपन-वेट परिवार का :free मॉडल चुनें। सबमिट करने से पहले मॉडल कार्ड और लाइसेंस जाँचें।'],['Generated through OpenRouter hosted inference. Verify the exact model card, weights availability, and license before describing this model as open-weight. This is not local/offline inference.','OpenRouter દ્વારા હોસ્ટેડ ઇન્ફરન્સથી બનાવ્યું. આ મોડલને ઓપન-વેઇટ કહેતાં પહેલાં તેનું મોડલ કાર્ડ, વેઇટ્સ અને લાઇસન્સ તપાસો. આ સ્થાનિક અથવા ઑફલાઇન ઇન્ફરન્સ નથી.','OpenRouter होस्टेड इन्फरेंस से बनाया गया। इसे ओपन-वेट कहने से पहले मॉडल कार्ड, वेट्स और लाइसेंस जाँचें। यह स्थानीय या ऑफ़लाइन इन्फरेंस नहीं है।'],['Generated with Gemma 4 through OpenRouter hosted inference. The official Gemma 4 model card lists Apache 2.0. This is not local or offline inference.','OpenRouter હોસ્ટેડ ઇન્ફરન્સ દ્વારા Gemma 4 સાથે બનાવ્યું. સત્તાવાર Gemma 4 મોડલ કાર્ડમાં Apache 2.0 છે. આ સ્થાનિક કે ઑફલાઇન ઇન્ફરન્સ નથી.','OpenRouter होस्टेड इन्फरेंस के ज़रिए Gemma 4 से बनाया गया। आधिकारिक Gemma 4 मॉडल कार्ड में Apache 2.0 दिया गया है। यह स्थानीय या ऑफ़लाइन इन्फरेंस नहीं है।'],['Language changed. New plans will use this language.','ભાષા બદલાઈ. નવો પ્લાન પસંદ કરેલી ભાષામાં બનશે.','भाषा बदल गई। नई योजनाएँ इसी भाषा में बनेंगी।'],['Text size updated.','લખાણનું કદ બદલાયું.','टेक्स्ट का आकार बदल गया।'],['Weekly goal updated.','અઠવાડિયાનું લક્ષ્ય બદલાયું.','साप्ताहिक लक्ष्य अपडेट हुआ।'],['Local progress cleared.','સ્થાનિક પ્રગતિ સાફ થઈ.','स्थानीय प्रगति मिटा दी गई।'],['Enter a display name first.','પહેલાં પ્રદર્શિત નામ લખો.','पहले दिखने वाला नाम दर्ज करें।'],['Enter your default city first.','પહેલાં તમારું મૂળ શહેર લખો.','पहले अपना डिफ़ॉल्ट शहर दर्ज करें।'],['Your preferences have been saved in this browser.','તમારી પસંદગીઓ આ બ્રાઉઝરમાં સાચવાઈ ગઈ છે.','आपकी पसंद इस ब्राउज़र में सेव हो गई है।'],['Your plan was generated through the selected OpenRouter model.','તમારો પ્લાન પસંદ કરેલા OpenRouter મોડલથી બન્યો.','आपकी योजना चुने हुए OpenRouter मॉडल से बनी।'],['Your plan is ready in demo mode. Add your key for model-generated plans.','તમારો ડેમો પ્લાન તૈયાર છે. મોડલથી પ્લાન બનાવવા તમારી કી ઉમેરો.','आपकी डेमो योजना तैयार है। मॉडल से योजना बनाने के लिए अपनी कुंजी जोड़ें।'],['Nice work. Your outing has been added to My Progress.','સરસ! તમારી પ્રવૃત્તિ મારી પ્રગતિમાં ઉમેરાઈ છે.','बहुत बढ़िया! आपकी गतिविधि मेरी प्रगति में जुड़ गई है।'],['Plans are suggestions. Check local conditions and trust your own judgement.','પ્લાન માત્ર સૂચન છે. સ્થાનિક પરિસ્થિતિ તપાસો અને સમજદારીથી નિર્ણય લો.','योजनाएँ केवल सुझाव हैं। स्थानीय स्थिति जाँचें और अपने विवेक पर भरोसा करें।'],['Best time to go','બહાર જવાનો શ્રેષ્ઠ સમય','बाहर जाने का सबसे अच्छा समय'],['Your step-by-step plan','તમારો પગલાંવાર પ્લાન','आपकी चरण-दर-चरण योजना'],['What to bring','સાથે શું લઈ જવું','क्या साथ ले जाएँ'],['Screen-free challenge','સ્ક્રીન વગરનો પડકાર','स्क्रीन-मुक्त चुनौती'],['A few safety notes','સલામતીની કેટલીક સૂચનાઓ','सुरक्षा के कुछ सुझाव'],['A little nature thought','પ્રકૃતિ વિશે એક વિચાર','प्रकृति पर एक विचार'],['Save plan','પ્લાન સાચવો','योजना सेव करें'],['I went outside','હું બહાર ગયો/ગઈ','मैं बाहर गया/गई'],['Outing logged','પ્રવૃત્તિ નોંધાઈ','गतिविधि दर्ज हुई'],['DEMO MODE · LOCAL TEMPLATE','ડેમો મોડ · સ્થાનિક નમૂનો','डेमो मोड · स्थानीय टेम्पलेट'],['Your outdoor plan','તમારો બહારનો પ્લાન','आपकी बाहरी योजना'],['Outdoor activity','બહારની પ્રવૃત્તિ','बाहरी गतिविधि'],['Put your phone away for the first 10 minutes.','પ્રથમ 10 મિનિટ ફોન દૂર રાખો.','पहले 10 मिनट फोन दूर रखें।'],['Step','પગલું','चरण'],['Searching green spaces near','આસપાસ હરિયાળી જગ્યાઓ શોધી રહ્યા છીએ','आस-पास हरियाली वाली जगहें खोजी जा रही हैं'],['Looking for green spaces','હરિયાળી જગ્યાઓ શોધી રહ્યા છીએ','हरियाली वाली जगहें खोजी जा रही हैं'],['Loading community map data. This can take a few seconds.','સમુદાયના નકશાનો ડેટા લોડ થઈ રહ્યો છે. થોડો સમય લાગી શકે છે.','समुदाय का मानचित्र डेटा लोड हो रहा है। इसमें कुछ सेकंड लग सकते हैं।'],['Searching','શોધી રહ્યા છીએ','खोज रहे हैं'],["Let's find some green",'ચાલો હરિયાળી શોધીએ','आइए हरियाली खोजें'],['Could not load park data','બગીચાનો ડેટા લોડ થઈ શક્યો નહીં','पार्क डेटा लोड नहीं हो सका'],['The map service is unavailable. Try again later.','નકશાની સેવા ઉપલબ્ધ નથી. પછીથી ફરી પ્રયાસ કરો.','मानचित्र सेवा उपलब्ध नहीं है। बाद में फिर प्रयास करें।'],['Browser storage is unavailable. Your progress may not persist after closing the page.','બ્રાઉઝર સ્ટોરેજ ઉપલબ્ધ નથી. પેજ બંધ કર્યા પછી પ્રગતિ સાચવાય નહીં.','ब्राउज़र स्टोरेज उपलब्ध नहीं है। पेज बंद करने पर प्रगति सेव नहीं हो सकती।'],['Clear all locally saved outings and points? This cannot be undone.','સ્થાનિક રીતે સાચવેલી બધી પ્રવૃત્તિ અને પોઇન્ટ્સ કાઢી નાખવા? આ પાછું ફેરવી શકાશે નહીં.','स्थानीय रूप से सेव की गई सभी गतिविधियाँ और पॉइंट मिटाएँ? इसे वापस नहीं किया जा सकता।']
  ];
  translationRows.push(
    ['Choose language','ભાષા પસંદ કરો','भाषा चुनें'],['Decrease text size','લખાણ નાનું કરો','टेक्स्ट छोटा करें'],['Increase text size','લખાણ મોટું કરો','टेक्स्ट बड़ा करें'],['City for live data','લાઇવ ડેટા માટે શહેર','लाइव डेटा के लिए शहर'],['Refresh weather','હવામાન ફરી લોડ કરો','मौसम फिर लोड करें'],['Refresh live data','લાઇવ ડેટા ફરી લોડ કરો','लाइव डेटा फिर लोड करें'],['Outdoor reminder','બહાર જવાની યાદ અપાવણી','बाहर जाने की याद'],['Open settings','સેટિંગ્સ ખોલો','सेटिंग्स खोलें'],['Toggle menu','મેનુ ખોલો/બંધ કરો','मेनू खोलें/बंद करें'],
    ['A bird','એક પક્ષી','एक पक्षी'],['A butterfly or bee','એક પતંગિયું અથવા મધમાખી','एक तितली या मधुमक्खी'],['A flowering plant','ફૂલ આપતો છોડ','फूल वाला पौधा'],['A very old tree','ખૂબ જૂનું વૃક્ષ','बहुत पुराना पेड़'],['Something red','લાલ રંગની કોઈ વસ્તુ','लाल रंग की कोई चीज़'],['A cloud shaped like something','કોઈ આકાર જેવું વાદળ','किसी आकार जैसा बादल'],['A leaf with an interesting shape','અનોખા આકારનું પાન','अनोखे आकार का पत्ता'],['An insect','એક જીવાત','एक कीड़ा'],['Running or still water','વહેતું અથવા સ્થિર પાણી','बहता या ठहरा हुआ पानी'],['A feather','એક પીંછું','एक पंख'],['Your own shadow','તમારો પોતાનો પડછાયો','आपकी अपनी परछाईं'],['A smooth stone','લીસો પથ્થર','चिकना पत्थर'],['A spider web','કરોળિયાનું જાળું','मकड़ी का जाला'],['A squirrel or lizard','ખિસકોલી અથવા ગરોળી','गिलहरी या छिपकली'],['Something that smells nice','સારી સુગંધવાળી વસ્તુ','अच्छी खुशबू वाली चीज़'],['A natural sound','પ્રકૃતિનો અવાજ','प्रकृति की आवाज़'],['A seed or fruit','બીજ અથવા ફળ','बीज या फल'],['A friendly dog','મૈત્રીપૂર્ણ કૂતરો','मिलनसार कुत्ता'],['A golden-hour glow','સાંજના સોનેરી પ્રકાશની ઝલક','सुनहरी शाम की रोशनी'],['A tiny wildflower','નાનું જંગલી ફૂલ','छोटा जंगली फूल'],
    ['First step','પહેલું પગલું','पहला कदम'],['Log your first outdoor outing.','તમારી પહેલી બહારની પ્રવૃત્તિ નોંધો.','अपनी पहली बाहरी गतिविधि दर्ज करें।'],['Nature explorer','પ્રકૃતિના પ્રવાસી','प्रकृति खोजी'],['Complete 5 outdoor outings.','5 બહારની પ્રવૃત્તિઓ પૂર્ણ કરો.','5 बाहरी गतिविधियाँ पूरी करें।'],['Three-day rhythm','ત્રણ દિવસની નિયમિતતા','तीन दिन की नियमितता'],['Keep a 3-day outing streak.','ત્રણ દિવસ સુધી બહાર જવાની નિયમિતતા રાખો.','तीन दिन लगातार बाहर जाएँ।'],['Reach your weekly outdoor goal.','અઠવાડિયાનું બહારનું લક્ષ્ય પૂર્ણ કરો.','साप्ताहिक बाहरी लक्ष्य पूरा करें।'],['Bingo master','બિંગો માસ્ટર','बिंगो मास्टर'],['Complete a Nature Bingo card.','નેચર બિંગો કાર્ડ પૂર્ણ કરો.','नेचर बिंगो कार्ड पूरा करें।'],['One hour outside','એક કલાક બહાર','एक घंटा बाहर'],['Log 60 minutes outdoors in total.','કુલ 60 મિનિટ બહાર વિતાવ્યાની નોંધ કરો.','बाहर बिताए कुल 60 मिनट दर्ज करें।'],['UNLOCKED','મેળવ્યું','अनलॉक हुआ'],['LOCKED','હજુ મળ્યું નથી','लॉक है'],['Feeling great','ખૂબ સારું લાગે છે','बहुत अच्छा लग रहा है'],['Feeling better','હવે સારું લાગે છે','अब बेहतर लग रहा है'],['About the same','લગભગ એવું જ','लगभग वैसा ही'],['A tough day','મુશ્કેલ દિવસ','कठिन दिन'],['Delete outing','પ્રવૃત્તિ કાઢી નાખો','गतिविधि हटाएँ'],['Outing removed from your local history.','પ્રવૃત્તિ તમારા સ્થાનિક ઇતિહાસમાંથી કાઢી નાખી.','गतिविधि आपके स्थानीय इतिहास से हटा दी गई।'],['Mood score after outing:','પ્રવૃત્તિ પછીનો મૂડ સ્કોર:','गतिविधि के बाद मूड स्कोर:'],['minutes outdoors','બહાર વિતાવેલી મિનિટો','बाहर बिताए मिनट'],['Best time:','શ્રેષ્ઠ સમય:','सबसे अच्छा समय:'],['WHAT TO BRING','સાથે શું લઈ જવું','क्या साथ ले जाएँ'],['PLAN','પ્લાન','योजना'],['SAFETY NOTES','સલામતીની સૂચનાઓ','सुरक्षा सुझाव'],['NATURE THOUGHT','પ્રકૃતિ વિશેનો વિચાર','प्रकृति पर विचार'],['Making your plan…','તમારો પ્લાન બનાવી રહ્યા છીએ…','आपकी योजना बनाई जा रही है…'],['Could not create a plan.','પ્લાન બનાવી શકાયો નહીં.','योजना नहीं बन सकी।'],['Please enter a city name.','શહેરનું નામ લખો.','शहर का नाम दर्ज करें।'],['Could not load live weather.','લાઇવ હવામાન લોડ થઈ શક્યું નહીં.','लाइव मौसम लोड नहीं हो सका।'],['Live conditions are unavailable','લાઇવ પરિસ્થિતિ ઉપલબ્ધ નથી','लाइव स्थिति उपलब्ध नहीं है'],['Weather could not be loaded. Check your connection.','હવામાન લોડ થઈ શક્યું નથી. તમારું કનેક્શન તપાસો.','मौसम लोड नहीं हो सका। अपना कनेक्शन जाँचें।'],['Could not load the live list.','લાઇવ યાદી લોડ થઈ શકી નથી.','लाइव सूची लोड नहीं हो सकी।'],['minutes outdoors','બહાર વિતાવેલી મિનિટો','बाहर बिताए मिनट'],['Outdoor score','બહાર જવાનો સ્કોર','बाहर जाने का स्कोर'],['Daily high','દિવસનું મહત્તમ','दैनिक अधिकतम'],['Daily low','દિવસનું લઘુત્તમ','दैनिक न्यूनतम'],['Minutes outdoors','બહાર વિતાવેલી મિનિટો','बाहर बिताए मिनट'],['Mood score after outing','પ્રવૃત્તિ પછીનો મૂડ સ્કોર','गतिविधि के बाद मूड स्कोर'],
    ['Monday','સોમવાર','सोमवार'],['Tuesday','મંગળવાર','मंगलवार'],['Wednesday','બુધવાર','बुधवार'],['Thursday','ગુરુવાર','गुरुवार'],['Friday','શુક્રવાર','शुक्रवार'],['Saturday','શનિવાર','शनिवार'],['Sunday','રવિવાર','रविवार'],['Mon','સોમ','सोम'],['Tue','મંગળ','मंगल'],['Wed','બુધ','बुध'],['Thu','ગુરુ','गुरु'],['Fri','શુક્ર','शुक्र'],['Sat','શનિ','शनि'],['Sun','રવિ','रवि'],
    ['Looks promising. Bring water, use sun protection when needed, and enjoy the fresh air.','હવામાન સારું લાગે છે. પાણી સાથે રાખો, જરૂર પડે તો સૂર્યથી બચાવ કરો અને તાજી હવાનો આનંદ માણો.','मौसम अच्छा लग रहा है। पानी साथ रखें, ज़रूरत हो तो धूप से बचें और ताज़ी हवा का आनंद लें।'],
    ['A short outing may be comfortable. Pick a shaded route and check the local conditions again before leaving.','ટૂંકી બહારની પ્રવૃત્તિ આરામદાયક હોઈ શકે છે. છાંયડાવાળો રસ્તો પસંદ કરો અને નીકળતાં પહેલાં સ્થિતિ ફરી તપાસો.','छोटी सैर आरामदायक हो सकती है। छायादार रास्ता चुनें और निकलने से पहले स्थिति फिर जाँचें।'],
    ['Choose your time carefully. Consider a shorter, gentler activity or wait for conditions to improve.','સમય સમજીને પસંદ કરો. ટૂંકી અને હળવી પ્રવૃત્તિ કરો અથવા સ્થિતિ સારી થાય ત્યાં સુધી રાહ જુઓ.','समय सोच-समझकर चुनें। छोटी और हल्की गतिविधि करें या स्थिति बेहतर होने तक प्रतीक्षा करें।'],
    ['Air quality is poor right now. Avoid intense outdoor activity and follow local health guidance.','હમણાં હવાની ગુણવત્તા ખરાબ છે. ભારે બહારની કસરત ટાળો અને સ્થાનિક આરોગ્ય સૂચનાઓ અનુસરો.','अभी हवा की गुणवत्ता खराब है। कठिन बाहरी गतिविधि से बचें और स्थानीय स्वास्थ्य सलाह मानें।'],
    ['It feels very hot. Avoid midday exertion, drink water, and consider a cooler time.','ખૂબ ગરમી લાગે છે. બપોરે ભારે પ્રવૃત્તિ ટાળો, પાણી પીતા રહો અને ઠંડો સમય પસંદ કરો.','बहुत गर्मी महसूस हो रही है। दोपहर में मेहनत से बचें, पानी पिएँ और ठंडा समय चुनें।'],
    ['Conditions may be uncomfortable. Consider an indoor alternative or check again later.','પરિસ્થિતિ અસુવિધાજનક હોઈ શકે છે. અંદરની પ્રવૃત્તિ પસંદ કરો અથવા પછી ફરી તપાસો.','स्थिति असुविधाजनक हो सकती है। घर के अंदर की गतिविधि चुनें या बाद में फिर जाँचें।'],
    ['It may be a good time to get outside','બહાર જવા માટે સારો સમય હોઈ શકે છે','बाहर जाने का अच्छा समय हो सकता है'],['Go gently and plan ahead','ધીમે કરો અને પહેલેથી પ્લાન બનાવો','आराम से करें और पहले योजना बनाएँ'],["Take extra care with today's conditions",'આજની સ્થિતિમાં વધુ કાળજી રાખો','आज की स्थिति में अतिरिक्त सावधानी रखें'],['Current weather','હાલનું હવામાન','मौजूदा मौसम'],['Conditions unavailable','પરિસ્થિતિ ઉપલબ્ધ નથી','स्थिति उपलब्ध नहीं है'],['Live conditions are unavailable','લાઇવ પરિસ્થિતિ ઉપલબ્ધ નથી','लाइव स्थिति उपलब्ध नहीं है'],['Refreshing conditions…','પરિસ્થિતિ ફરી લોડ થઈ રહી છે…','स्थिति फिर लोड हो रही है…'],['Loading live conditions…','લાઇવ પરિસ્થિતિ લોડ થઈ રહી છે…','लाइव स्थिति लोड हो रही है…'],['Updated','અપડેટ થયું','अपडेट हुआ'],['Searching green spaces near','નજીકની હરિયાળી જગ્યાઓ શોધી રહ્યા છીએ','पास की हरियाली खोजी जा रही है'],['Map data unavailable','નકશાનો ડેટા ઉપલબ્ધ નથી','मानचित्र डेटा उपलब्ध नहीं है'],['No named parks were returned for','આ શહેર માટે નામવાળા બગીચા મળ્યા નથી:','इस शहर के लिए नाम वाले पार्क नहीं मिले:'],['No remaining hourly data','આગામી કલાકોનો ડેટા નથી','आगे के घंटों का डेटा नहीं है'],['Highest remaining hourly score:','આગામી કલાકોમાં સૌથી ઊંચો સ્કોર:','आने वाले घंटों में सबसे ऊँचा स्कोर:'],['estimated score','અંદાજિત સ્કોર','अनुमानित स्कोर'],['Feeling great','ખૂબ સારું લાગે છે','बहुत अच्छा लग रहा है'],['Feeling better','હવે સારું લાગે છે','अब बेहतर लग रहा है'],['About the same','લગભગ એવું જ','लगभग वैसा ही'],['A tough day','મુશ્કેલ દિવસ','कठिन दिन'],['A model-generated plan is ready.','મોડલ દ્વારા બનાવેલો પ્લાન તૈયાર છે.','मॉडल से बनी योजना तैयार है।'],['Refresh models','મોડલ ફરી લોડ કરો','मॉडल फिर से लोड करें']
  );
  translationRows.forEach(([en, gu, hi]) => translations.set(en.trim().toLocaleLowerCase(), { gu, hi }));

  function translatedPhrase(source) {
    const row = translations.get(String(source || '').trim().toLocaleLowerCase());
    return activeLanguage === 'en' ? String(source || '').trim() : (row?.[activeLanguage] || String(source || '').trim());
  }
  function uiLocale() { return activeLanguage === 'gu' ? 'gu-IN' : activeLanguage === 'hi' ? 'hi-IN' : 'en-IN'; }
  function translateTextNode(node) {
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
    const original = originalTextNodes.get(node);
    const trimmed = original.trim();
    if (!trimmed) return;
    let translated = translatedPhrase(trimmed);
    let dynamicMatch = trimmed.match(/^Feels like (.+)$/i);
    if (dynamicMatch && activeLanguage !== 'en') translated = `${translatedPhrase('Feels like')} ${dynamicMatch[1]}`;
    dynamicMatch = trimmed.match(/^Updated (.+)$/i);
    if (dynamicMatch && activeLanguage !== 'en') translated = `${translatedPhrase('Updated')} ${dynamicMatch[1]}`;
    dynamicMatch = trimmed.match(/^(\d+) places found$/i);
    if (dynamicMatch && activeLanguage !== 'en') translated = activeLanguage === 'gu' ? `${dynamicMatch[1]} જગ્યાઓ મળી` : `${dynamicMatch[1]} जगहें मिलीं`;
    if (node.parentElement?.id === 'greetingTitle') {
      const match = trimmed.match(/^(Good morning|Good afternoon|Good evening),\s*(.+)\.$/i);
      if (match && activeLanguage !== 'en') {
        const greeting = activeLanguage === 'gu' ? ({'good morning':'સુપ્રભાત','good afternoon':'શુભ બપોર','good evening':'શુભ સાંજ'}[match[1].toLowerCase()]) : ({'good morning':'सुप्रभात','good afternoon':'नमस्कार','good evening':'शुभ संध्या'}[match[1].toLowerCase()]);
        translated = `${greeting}, ${match[2]}.`;
      }
    }
    if (translated !== trimmed) {
      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      node.nodeValue = `${leading}${translated}${trailing}`;
    } else if (node.nodeValue.trim() !== trimmed) {
      // Restore the source wording when returning to English.
      node.nodeValue = original;
    }
  }
  function translateAttribute(element, attribute) {
    if (!element.hasAttribute(attribute)) return;
    let saved = originalAttributes.get(element);
    if (!saved) { saved = {}; originalAttributes.set(element, saved); }
    if (!(attribute in saved)) saved[attribute] = element.getAttribute(attribute);
    const source = saved[attribute];
    const translated = translatedPhrase(source);
    if (element.getAttribute(attribute) !== translated) element.setAttribute(attribute, translated);
  }
  function applyTextScale(root = document.body) {
    const scale = FONT_LEVELS[fontLevel] || 1.15;
    const textElements = new Set();
    const addTextParent = node => {
      const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : null;
      if (element && !element.closest('script,style,svg,noscript')) textElements.add(element);
    };
    if (root?.nodeType === Node.TEXT_NODE) addTextParent(root);
    else if (root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) addTextParent(node);
      if (root.nodeType === Node.ELEMENT_NODE && root.matches('input,select,textarea,option')) textElements.add(root);
      root.querySelectorAll?.('input,select,textarea,option').forEach(element => textElements.add(element));
    }
    textElements.forEach(element => {
      if (!baseFontSizes.has(element)) {
        const computed = Number.parseFloat(getComputedStyle(element).fontSize);
        baseFontSizes.set(element, Number.isFinite(computed) ? computed : 14);
        const lineNumber = Number.parseFloat(getComputedStyle(element).lineHeight);
        baseLineHeights.set(element, Number.isFinite(lineNumber) ? lineNumber : null);
      }
      const base = baseFontSizes.get(element);
      const size = Math.max(11.5, base * scale);
      element.style.setProperty('font-size', `${size.toFixed(2)}px`, 'important');
      const lineBase = baseLineHeights.get(element);
      if (lineBase && lineValueIsPixel(element)) element.style.setProperty('line-height', `${Math.max(lineBase * scale, size * 1.18).toFixed(2)}px`, 'important');
    });
    const readout = document.getElementById('fontSizeValue');
    if (readout) readout.textContent = `${Math.round(scale * 100)}%`;
    if (root === document.body && window.Chart?.defaults) window.Chart.defaults.font.size = Math.round(12 * scale);
    if (root === document.body && typeof chartInstances !== 'undefined') Object.values(chartInstances).forEach(chart => {
      try {
        chart.options.scales && Object.values(chart.options.scales).forEach(axis => {
          if (axis.ticks) axis.ticks.font = { ...(axis.ticks.font || {}), size: Math.round(11 * scale) };
        });
        chart.update('none');
      } catch {}
    });
  }
  function lineValueIsPixel(element) {
    const computed = getComputedStyle(element).lineHeight;
    return computed !== 'normal' && Number.isFinite(Number.parseFloat(computed));
  }
  function translateDom(root = document.body) {
    if (root === document.body) {
      document.documentElement.lang = activeLanguage === 'gu' ? 'gu' : activeLanguage === 'hi' ? 'hi' : 'en';
      const selector = document.getElementById('languageSelect');
      if (selector && selector.value !== activeLanguage) selector.value = activeLanguage;
    }
    const textNodes = [];
    if (root?.nodeType === Node.TEXT_NODE) textNodes.push(root);
    else if (root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) textNodes.push(node);
    }
    textNodes.forEach(node => {
      if (!node.parentElement?.closest('script,style,svg,noscript')) translateTextNode(node);
    });
    const attrSelector = '[placeholder],[title],[aria-label],[data-title]';
    const elements = [];
    if (root?.nodeType === Node.ELEMENT_NODE && root.matches(attrSelector)) elements.push(root);
    if (root?.querySelectorAll) elements.push(...root.querySelectorAll(attrSelector));
    elements.forEach(element => ['placeholder','title','aria-label','data-title'].forEach(attr => translateAttribute(element, attr)));
    applyTextScale(root);
  }
  function setLanguage(language, announce = false) {
    activeLanguage = ['en','gu','hi'].includes(language) ? language : 'en';
    try { localStorage.setItem(LANGUAGE_KEY, activeLanguage); } catch {}
    translateDom();
    const activePage = document.querySelector('.page.active');
    const crumb = document.getElementById('crumbCurrent');
    if (activePage && crumb) crumb.textContent = activePage.getAttribute('data-title') || 'Home';
    if (announce && typeof notify === 'function') notify(translatedPhrase('Language changed. New plans will use this language.'));
  }
  function setFontLevel(nextLevel, announce = false) {
    fontLevel = Math.max(0, Math.min(FONT_LEVELS.length - 1, nextLevel));
    try { localStorage.setItem(FONT_SCALE_KEY, String(fontLevel)); } catch {}
    applyTextScale();
    if (announce && typeof notify === 'function') notify(translatedPhrase('Text size updated.'));
  }
  function initAccessibility() {
    const lang = document.getElementById('languageSelect');
    if (lang) lang.addEventListener('change', () => setLanguage(lang.value, true));
    document.getElementById('fontSmaller')?.addEventListener('click', () => setFontLevel(fontLevel - 1, true));
    document.getElementById('fontLarger')?.addEventListener('click', () => setFontLevel(fontLevel + 1, true));
    // Preserve English values for existing app logic while displaying translated option labels.
    document.querySelectorAll('select option:not([value])').forEach(option => { option.value = option.textContent.trim(); });
    // Only handle added fragments, instead of rescanning/scaling every page after
    // every dynamic update. This avoids a major source of browser-side CPU usage.
    const pendingRoots = new Set();
    let translateScheduled = false;
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        if (record.type !== 'childList') return;
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) pendingRoots.add(node);
          else if (node.nodeType === Node.ELEMENT_NODE && !node.matches('script,style,svg,noscript') && !node.closest('script,style,svg,noscript')) pendingRoots.add(node);
        });
      });
      if (!pendingRoots.size || translateScheduled) return;
      translateScheduled = true;
      requestAnimationFrame(() => {
        translateScheduled = false;
        const roots = [...pendingRoots]; pendingRoots.clear();
        const elementRoots = roots.filter(node => node.nodeType === Node.ELEMENT_NODE);
        roots.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (!elementRoots.some(parent => parent === node.parentElement || parent.contains(node.parentElement))) translateDom(node);
          } else if (!elementRoots.some(parent => parent !== node && parent.contains(node))) translateDom(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    translateDom();
  }
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safeJSON = (text, fallback) => { try { return JSON.parse(text); } catch { return fallback; } };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icons = () => { if (window.lucide?.createIcons) window.lucide.createIcons(); };
  function loadScriptOnce(src, globalName) {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
    if (!window.__touchGrassScriptPromises) window.__touchGrassScriptPromises = new Map();
    const registry = window.__touchGrassScriptPromises;
    if (registry.has(src)) return registry.get(src);
    const promise = new Promise(resolve => {
      const script = document.createElement('script'); script.src = src; script.async = true;
      script.onload = () => resolve(globalName ? window[globalName] : true);
      script.onerror = () => { registry.delete(src); resolve(null); };
      document.head.appendChild(script);
    });
    registry.set(src, promise); return promise;
  }
  function loadStylesheetOnce(href) {
    if (!window.__touchGrassStylePromises) window.__touchGrassStylePromises = new Map();
    const registry = window.__touchGrassStylePromises;
    if (registry.has(href)) return registry.get(href);
    const promise = new Promise(resolve => {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href;
      link.onload = () => resolve(true);
      link.onerror = () => { registry.delete(href); resolve(false); };
      document.head.appendChild(link);
    });
    registry.set(href, promise); return promise;
  }
  function ensureLucide() {
    if (window.lucide?.createIcons) return Promise.resolve(true);
    if (!lucideLoadPromise) lucideLoadPromise = loadScriptOnce('https://unpkg.com/lucide@latest', 'lucide').then(value => { if (value) icons(); return !!value; });
    return lucideLoadPromise;
  }
  function ensureChartLibrary() {
    if (window.Chart) return Promise.resolve(true);
    if (!chartLoadPromise) chartLoadPromise = loadScriptOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js', 'Chart').then(value => !!value);
    return chartLoadPromise;
  }
  function ensureLeaflet() {
    if (window.L) return Promise.resolve(true);
    if (!leafletLoadPromise) leafletLoadPromise = Promise.all([
      loadStylesheetOnce('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'),
      loadScriptOnce('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js', 'L')
    ]).then(([, library]) => !!library);
    return leafletLoadPromise;
  }
  function scheduleChartLoad() {
    const run = () => ensureChartLibrary().then(loaded => {
      if (!loaded) return;
      if (weatherData) renderWeather(weatherData);
      if ($('#page-progress')?.classList.contains('active')) renderProgress();
    });
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3500 });
    else window.setTimeout(run, 1800);
  }
  const todayISO = () => new Date().toLocaleDateString('en-CA');
  const moodNumbers = { 'Stressed': 2, 'Tired': 3, 'Bored': 4, 'Okay': 6, 'Energetic': 8, 'Need a reset': 5 };
  const activityIcons = { 'Hiking / Walk':'footprints', 'Gardening':'sprout', 'Bird Watching':'bird', 'Outdoor Sports':'volleyball', 'Picnic':'coffee', 'Yoga in Nature':'flower-2', 'Cycling':'bike', 'Photography Walk':'camera', 'Jogging':'person-standing' };
  const weatherEmojis = (code, isDay = true) => {
    if (code === 0) return isDay ? '☀️' : '🌙';
    if (code === 1) return '🌤️';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if ([45,48].includes(Number(code))) return '🌫️';
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(Number(code))) return '🌦️';
    if ([71,73,75,77,85,86].includes(Number(code))) return '🌨️';
    if ([95,96,99].includes(Number(code))) return '⛈️';
    return '🌿';
  };
  const numberText = (value, suffix = '') => value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? '--' : `${Math.round(Number(value) * 10) / 10}${suffix}`;
  const aqiInfo = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return { text: 'Unavailable', className: 'neutral' };
    const n = Number(value);
    if (n <= 50) return { text: 'Good', className: 'good' };
    if (n <= 100) return { text: 'Moderate', className: 'warning' };
    if (n <= 150) return { text: 'Unhealthy for sensitive groups', className: 'warning' };
    if (n <= 200) return { text: 'Unhealthy', className: 'danger' };
    if (n <= 300) return { text: 'Very unhealthy', className: 'danger' };
    return { text: 'Hazardous', className: 'danger' };
  };
  const uvInfo = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return { text: 'Unavailable', className: 'neutral' };
    if (n < 3) return { text: 'Low', className: 'good' };
    if (n < 6) return { text: 'Moderate', className: 'neutral' };
    if (n < 8) return { text: 'High', className: 'warning' };
    if (n < 11) return { text: 'Very high', className: 'danger' };
    return { text: 'Extreme', className: 'danger' };
  };
  const scoreAdvice = (score, current) => {
    if (score >= 80) return 'Looks promising. Bring water, use sun protection when needed, and enjoy the fresh air.';
    if (score >= 60) return 'A short outing may be comfortable. Pick a shaded route and check the local conditions again before leaving.';
    if (score >= 40) return 'Choose your time carefully. Consider a shorter, gentler activity or wait for conditions to improve.';
    if (current?.aqi > 150) return 'Air quality is poor right now. Avoid intense outdoor activity and follow local health guidance.';
    if (current?.temperature > 36 || current?.feels_like > 36) return 'It feels very hot. Avoid midday exertion, drink water, and consider a cooler time.';
    return 'Conditions may be uncomfortable. Consider an indoor alternative or check again later.';
  };
  const scoreForForecast = (high, rain, uv, aqi) => {
    let score = 100;
    if (high > 40) score -= 35; else if (high > 36) score -= 22; else if (high > 32) score -= 10; else if (high < 8) score -= 22; else if (high < 15) score -= 10;
    if (rain > 70) score -= 25; else if (rain > 40) score -= 12;
    if (aqi != null) { if (aqi > 200) score -= 45; else if (aqi > 150) score -= 30; else if (aqi > 100) score -= 18; else if (aqi > 50) score -= 8; }
    if (uv >= 11) score -= 20; else if (uv >= 8) score -= 12; else if (uv >= 6) score -= 6;
    return Math.max(0, Math.min(100, score));
  };

  const defaultData = { profileName: 'Tanmay', city: 'Ahmedabad', weeklyGoal: 150, points: 0, sessions: [], completedMissions: 0 };
  let data = { ...defaultData, ...safeJSON(localStorage.getItem(STORAGE_KEY) || '{}', {}) };
  if (!Array.isArray(data.sessions)) data.sessions = [];
  data.weeklyGoal = Number(data.weeklyGoal) || 150;
  let weatherData = null;
  let parkData = [];
  let parkMap = null;
  let parkMarkers = null;
  let lastPlan = null;
  let activePlanLogged = false;
  let chartInstances = {};
  let lucideLoadPromise = null;
  let chartLoadPromise = null;
  let leafletLoadPromise = null;
  let modelsLoaded = false;
  let bingo = safeJSON(localStorage.getItem(BINGO_KEY) || 'null', null);
  const bingoPool = [
    { label: 'A bird', emoji: '🐦' }, { label: 'A butterfly or bee', emoji: '🦋' },
    { label: 'A flowering plant', emoji: '🌼' }, { label: 'A very old tree', emoji: '🌳' },
    { label: 'Something red', emoji: '🔴' }, { label: 'A cloud shaped like something', emoji: '☁️' },
    { label: 'A leaf with an interesting shape', emoji: '🍃' }, { label: 'An insect', emoji: '🐞' },
    { label: 'Running or still water', emoji: '💧' }, { label: 'A feather', emoji: '🪶' },
    { label: 'Your own shadow', emoji: '🌗' }, { label: 'A smooth stone', emoji: '🪨' },
    { label: 'A spider web', emoji: '🕸️' }, { label: 'A squirrel or lizard', emoji: '🦎' },
    { label: 'Something that smells nice', emoji: '🌸' }, { label: 'A natural sound', emoji: '🎧' },
    { label: 'A seed or fruit', emoji: '🌰' }, { label: 'A friendly dog', emoji: '🐕' },
    { label: 'A golden-hour glow', emoji: '🌅' }, { label: 'A tiny wildflower', emoji: '🌱' }
  ];

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { notify('Browser storage is unavailable. Your progress may not persist after closing the page.', 'error'); }
  }
  function persistBingo() { try { localStorage.setItem(BINGO_KEY, JSON.stringify(bingo)); } catch { /* page remains usable without persistence */ } }
  function notify(message, type = 'success') {
    const region = $('#toastRegion');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    const iconName = type === 'error' ? 'alert-circle' : 'leaf';
    toast.innerHTML = `<i data-lucide="${iconName}"></i><span>${escapeHtml(message)}</span>`;
    region.appendChild(toast); icons();
    setTimeout(() => toast.remove(), 4200);
  }
  function displayName() { return (data.profileName || 'Explorer').trim() || 'Explorer'; }
  function setProfileUI() {
    const name = displayName();
    const initial = name.charAt(0).toUpperCase();
    ['#sidebarName','#topName'].forEach(sel => { const el = $(sel); if (el) el.textContent = name; });
    ['#sidebarAvatar','#topAvatar'].forEach(sel => { const el = $(sel); if (el) el.textContent = initial; });
    $('#profileNameInput').value = name;
    $('#profileCityInput').value = data.city || 'Ahmedabad';
    $('#profileWeeklyGoal').value = String(data.weeklyGoal);
    $('#topCity').value = data.city || 'Ahmedabad';
    $('#planCity').value = data.city || 'Ahmedabad';
    $('#parkCity').value = data.city || 'Ahmedabad';
    $('#weeklyGoal').value = String(data.weeklyGoal);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    $('#greetingTitle').innerHTML = `${greeting}, ${escapeHtml(name)}.<br><span>Let's get outside.</span>`;
    const now = new Date();
    $('#todayDate').textContent = now.toLocaleDateString(uiLocale(), { month: 'short', day: 'numeric', year: 'numeric' });
    $('#todayWeekday').textContent = now.toLocaleDateString(uiLocale(), { weekday: 'long' });
  }
  function setText(selector, text) { const el = $(selector); if (el) el.textContent = text; }
  function setPlaceholderWeather(message) {
    ['#heroTemperature','#metricTemp','#metricAqi','#metricUv','#metricHumidity','#conditionsTemp','#conditionsFeels','#detailAqi','#detailUv','#detailWind'].forEach(sel => setText(sel, '--'));
    setText('#heroCondition', message); setText('#conditionsText', message);
    setText('#scoreAdvice', message); setText('#weatherUpdated', 'Not available');
    const gauge = $('#scoreGauge'); if (gauge) gauge.style.background = 'conic-gradient(#d9e4da 0deg 360deg)';
    setText('#outdoorScore', '--');
    ['#homeHourlyEmpty','#forecastChartEmpty','#weeklyMinutesEmpty'].forEach(sel => { const el = $(sel); if (el && sel !== '#weeklyMinutesEmpty') el.style.display = 'grid'; });
  }
  async function fetchWeather(city = data.city, forceRefresh = false) {
    const cleanCity = (city || 'Ahmedabad').trim();
    if (!cleanCity) { notify('Please enter a city name.', 'error'); return; }
    setText('#heroCondition', 'Refreshing conditions…');
    setText('#scoreAdvice', 'Loading live conditions…');
    try {
      const refreshParam = forceRefresh ? '&refresh=1' : '';
      const response = await fetch(`/api/weather?city=${encodeURIComponent(cleanCity)}${refreshParam}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load live weather.');
      weatherData = payload;
      data.city = cleanCity;
      persist();
      renderWeather(payload);
      setProfileUI();
      if ($('#page-forecast').classList.contains('active')) renderForecast(payload);
      if ($('#page-conditions').classList.contains('active')) renderConditions(payload);
      if ($('#page-planner').classList.contains('active')) updatePlanWeatherNote();
      if ($('#page-parks').classList.contains('active') && $('#parkCity').value.trim().toLowerCase() === cleanCity.toLowerCase()) {
        renderParkMap();
      }
    } catch (error) {
      setPlaceholderWeather('Live conditions are unavailable');
      setText('#heroCity', cleanCity);
      setText('#weatherUpdated', 'Unavailable');
      notify(error.message || 'Weather could not be loaded. Check your connection.', 'error');
    }
  }
  function formatClock(value) {
    if (!value) return '--';
    const timePart = String(value).includes('T') ? String(value).split('T')[1] : String(value);
    const match = timePart.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '--';
    let hour = Number(match[1]); const minutes = match[2];
    const suffix = hour >= 12 ? 'PM' : 'AM'; hour = hour % 12 || 12;
    return `${hour}:${minutes} ${suffix}`;
  }
  function renderWeather(payload) {
    const place = payload.place || {}; const current = payload.current || {};
    const cityLabel = [place.name, place.admin1].filter(Boolean).join(', ') || data.city;
    const icon = weatherEmojis(current.code, current.is_day);
    setText('#heroTemperature', numberText(current.temperature, '°'));
    setText('#heroCondition', current.condition || 'Current weather');
    setText('#heroWeatherIcon', icon); setText('#heroCity', place.name || data.city);
    setText('#metricTemp', numberText(current.temperature, '°C'));
    setText('#metricFeels', `Feels like ${numberText(current.feels_like, '°C')}`);
    setText('#metricAqi', current.aqi == null ? '--' : String(Math.round(current.aqi)));
    setText('#metricAqiLabel', aqiInfo(current.aqi).text);
    setText('#metricUv', numberText(current.uv)); setText('#metricUvLabel', uvInfo(current.uv).text);
    setText('#metricHumidity', numberText(current.humidity, '%'));
    setText('#outdoorScore', String(current.score ?? '--'));
    const gauge = $('#scoreGauge');
    if (gauge && current.score != null) gauge.style.background = `conic-gradient(from -90deg, #59bb6d 0%, #b9e779 ${Math.max(0, current.score)}%, #e9f0e8 ${Math.max(0, current.score)}% 100%)`;
    const pill = $('#scorePill');
    if (pill) { pill.className = 'status-pill'; if (current.score < 40) pill.classList.add('danger'); else if (current.score < 65) pill.classList.add('warning'); else if (current.score == null) pill.classList.add('neutral'); pill.textContent = current.score_label || 'Outdoor estimate'; }
    setText('#scoreAdvice', scoreAdvice(Number(current.score || 0), current));
    setText('#weatherUpdated', payload.updated ? `Updated ${formatClock(payload.updated)}` : 'Live data');
    setText('#conditionsPlace', `${cityLabel.toUpperCase()}`);
    setText('#conditionsWeatherIcon', icon); setText('#conditionsTemp', numberText(current.temperature, '°'));
    setText('#conditionsText', current.condition || 'Conditions unavailable');
    setText('#conditionsFeels', numberText(current.feels_like, '°C'));
    setText('#conditionsWind', numberText(current.wind, ' km/h'));
    setText('#conditionsHumidity', numberText(current.humidity, '%'));
    setText('#conditionsRain', numberText(current.rain, '%'));
    setText('#conditionsAdviceTitle', current.score >= 80 ? 'It may be a good time to get outside' : current.score >= 60 ? 'Go gently and plan ahead' : "Take extra care with today's conditions");
    setText('#conditionsAdvice', scoreAdvice(Number(current.score || 0), current));
    const aqi = aqiInfo(current.aqi); const uv = uvInfo(current.uv);
    setText('#detailAqi', current.aqi == null ? '--' : String(Math.round(current.aqi))); setText('#detailAqiLabel', aqi.text);
    setText('#detailUv', numberText(current.uv)); setText('#detailUvLabel', uv.text); setText('#detailWind', numberText(current.wind, ' km/h'));
    const detailAqi = $('#detailAqiLabel'); if (detailAqi) detailAqi.style.color = aqi.className === 'danger' ? '#bd584b' : aqi.className === 'warning' ? '#b17a1b' : '#3d9860';
    const detailUv = $('#detailUvLabel'); if (detailUv) detailUv.style.color = uv.className === 'danger' ? '#bd584b' : uv.className === 'warning' ? '#b17a1b' : '#3d9860';
    setText('#sunriseTime', formatClock(payload.sunrise)); setText('#sunsetTime', formatClock(payload.sunset));
    setText('#forecastPlace', `${place.name || data.city} · 7-day outlook`);
    updatePlanWeatherNote();
    renderHourlyChart(payload);
    renderForecast(payload);
  }
  function updatePlanWeatherNote() {
    const label = $('#planWeatherLabel'); const detail = $('#planWeatherDetail');
    if (!label || !detail) return;
    if (!weatherData?.current) { label.textContent = 'Live conditions not available'; detail.textContent = 'A basic plan can still be created without weather data.'; return; }
    const c = weatherData.current;
    label.textContent = `${weatherData.place?.name || data.city}: ${numberText(c.temperature, '°C')} · ${c.condition}`;
    detail.textContent = `Outdoor score ${c.score}/100 · AQI ${c.aqi == null ? 'not available' : Math.round(c.aqi)} · UV ${numberText(c.uv)}`;
  }
  function renderHourlyChart(payload) {
    const hours = payload.hours || [];
    const canvas = $('#homeHourlyChart'); const empty = $('#homeHourlyEmpty');
    if (!canvas || !window.Chart) return;
    if (!hours.length) { if (empty) empty.style.display = 'grid'; return; }
    if (empty) empty.style.display = 'none';
    const labels = hours.map(item => item.label);
    const scores = hours.map(item => item.score);
    const ctx = canvas.getContext('2d');
    if (chartInstances.homeHourly) chartInstances.homeHourly.destroy();
    const gradient = ctx.createLinearGradient(0, 0, 0, 210);
    gradient.addColorStop(0, 'rgba(94,190,111,.25)'); gradient.addColorStop(1, 'rgba(94,190,111,0)');
    chartInstances.homeHourly = new Chart(ctx, {
      type: 'line', data: { labels, datasets: [{ label: translatedPhrase('Outdoor score'), data: scores, fill: true, backgroundColor: gradient, borderColor: '#53b66b', borderWidth: 2.5, tension: .36, pointBackgroundColor: '#fff', pointBorderColor: '#53b66b', pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#153f31', padding: 11, displayColors: false, callbacks: { label: item => ` Score: ${item.raw}/100` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#91a497', font: { family: 'DM Sans', size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } }, y: { min: 0, max: 100, grid: { color: '#edf2ec', drawTicks: false }, border: { display: false, dash: [4, 4] }, ticks: { color: '#91a497', font: { family: 'DM Sans', size: 9 }, stepSize: 25, padding: 8 } } } }
    });
  }
  function renderConditions(payload) {
    if (!payload) return;
    const current = payload.current || {};
    const icon = weatherEmojis(current.code, current.is_day);
    setText('#conditionsWeatherIcon', icon); setText('#conditionsTemp', numberText(current.temperature, '°'));
    setText('#conditionsText', current.condition || 'Conditions unavailable'); setText('#conditionsFeels', numberText(current.feels_like, '°C'));
    setText('#conditionsWind', numberText(current.wind, ' km/h')); setText('#conditionsHumidity', numberText(current.humidity, '%'));
    setText('#conditionsRain', numberText(current.rain, '%')); setText('#conditionsPlace', `${payload.place?.name || data.city}${payload.place?.country ? `, ${payload.place.country}` : ''}`.toUpperCase());
  }
  function renderForecast(payload) {
    if (!payload) return;
    const forecast = payload.forecast || [];
    const cardContainer = $('#forecastDays');
    if (!forecast.length) { cardContainer.innerHTML = '<div class="empty-state card">No forecast information is available right now.</div>'; return; }
    const best = forecast.map(day => ({...day, score: scoreForForecast(Number(day.high), Number(day.rain || 0), Number(day.uv || 0), payload.current?.aqi)})).sort((a,b) => b.score - a.score)[0];
    setText('#bestForecastDay', best ? `${best.label}, ${best.date_label}` : '--');
    setText('#bestForecastNote', best ? `${best.condition} · estimated score ${best.score}/100` : 'Waiting for forecast');
    const topHour = (payload.hours || []).slice().sort((a,b) => b.score - a.score)[0];
    setText('#bestWindow', topHour ? topHour.label : '--');
    setText('#bestWindowNote', topHour ? `Highest remaining hourly score: ${topHour.score}/100` : 'No remaining hourly data');
    const maxRain = Math.max(...forecast.map(day => Number(day.rain || 0)));
    setText('#rainOutlook', `${maxRain}%`);
    cardContainer.innerHTML = forecast.map((day, index) => `
      <article class="card forecast-day-card ${index === 0 ? 'today' : ''}">
        <span class="forecast-day-name">${escapeHtml(index === 0 ? 'Today' : day.label)}</span><span class="forecast-day-date">${escapeHtml(day.date_label)}</span>
        <span class="forecast-day-icon">${weatherEmojis(day.code, true)}</span><strong class="forecast-day-high">${numberText(day.high, '°')}</strong><span class="forecast-day-low">${numberText(day.low, '°')}</span>
        <span class="forecast-day-condition">${escapeHtml(day.condition || 'Forecast')}</span><span class="rain-chip"><i data-lucide="droplets"></i> ${numberText(day.rain, '%')}</span>
      </article>`).join('');
    icons();
    const canvas = $('#forecastChart'); const empty = $('#forecastChartEmpty');
    if (!canvas || !window.Chart) return;
    if (empty) empty.style.display = 'none';
    if (chartInstances.forecast) chartInstances.forecast.destroy();
    chartInstances.forecast = new Chart(canvas.getContext('2d'), {
      type: 'line', data: { labels: forecast.map(day => day.label), datasets: [
        { label: translatedPhrase('Daily high'), data: forecast.map(day => day.high), borderColor: '#f0a14e', backgroundColor: 'rgba(240,161,78,.09)', tension: .34, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#fff', pointBorderColor: '#f0a14e', fill: false },
        { label: translatedPhrase('Daily low'), data: forecast.map(day => day.low), borderColor: '#63a9df', backgroundColor: 'rgba(99,169,223,.07)', tension: .34, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#fff', pointBorderColor: '#63a9df', fill: false }
      ] }, options: { responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false}, plugins:{legend:{display:false},tooltip:{backgroundColor:'#153f31',padding:11}}, scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#91a497',font:{family:'DM Sans',size:10}}},y:{grid:{color:'#edf2ec',drawTicks:false},border:{display:false,dash:[4,4]},ticks:{color:'#91a497',font:{family:'DM Sans',size:10},padding:8},suggestedMin:Math.min(...forecast.map(d=>d.low))-3,suggestedMax:Math.max(...forecast.map(d=>d.high))+3}} }
    });
  }

  function showPage(pageName) {
    const page = $(`#page-${pageName}`);
    if (!page) pageName = 'home';
    $$('.page').forEach(item => item.classList.toggle('active', item.id === `page-${pageName}`));
    $$('.nav-item[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === pageName));
    const active = $(`#page-${pageName}`);
    setText('#crumbCurrent', active?.dataset.title || 'Home');
    $('#sidebar').classList.remove('mobile-open'); $('#mobileOverlay').classList.remove('visible');
    if (pageName === 'forecast') { if (weatherData) renderForecast(weatherData); ensureChartLibrary().then(loaded => { if (loaded && weatherData && $('#page-forecast').classList.contains('active')) renderForecast(weatherData); }); }
    if (pageName === 'conditions' && weatherData) renderConditions(weatherData);
    if (pageName === 'parks') { setTimeout(() => { if (parkMap) parkMap.invalidateSize(); if (!parkData.length && !$('#parkMap .leaflet-container')) loadParks($('#parkCity').value || data.city); }, 120); }
    if (pageName === 'progress') { renderProgress(); ensureChartLibrary().then(loaded => { if (loaded && $('#page-progress').classList.contains('active')) renderProgress(); }); }
    if (pageName === 'bingo') renderBingo();
    icons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function bindNavigation() {
    $$('[data-page]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
    $$('[data-nav]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.nav)));
    $('#mobileMenu').addEventListener('click', () => { $('#sidebar').classList.toggle('mobile-open'); $('#mobileOverlay').classList.toggle('visible'); });
    $('#mobileOverlay').addEventListener('click', () => { $('#sidebar').classList.remove('mobile-open'); $('#mobileOverlay').classList.remove('visible'); });
    $('#refreshWeather').addEventListener('click', () => fetchWeather($('#topCity').value || data.city, true));
    $('#topCity').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); fetchWeather($('#topCity').value, true); } });
    $('#notificationButton').addEventListener('click', () => notify('Your reminder: step outside when it feels right. This app does not send background notifications.'));
    $('#logQuickMission').addEventListener('click', () => logOuting({ title: '10-minute scenic reset', activity: 'Hiking / Walk', duration: 10, moodBefore: 'Okay', moodAfter: 7 }));
  }

  async function loadModels(force = false) {
    if (modelsLoaded && !force) return;
    const select = $('#aiModel'); const help = $('#modelHelp');
    select.innerHTML = '<option value="">Loading available models…</option>';
    try {
      const response = await fetch('/api/models', { cache: 'no-store' });
      const payload = await response.json();
      const models = payload.models || [];
      select.innerHTML = '';
      if (!models.length) throw new Error('No models found');
      models.forEach((model, index) => {
        const option = document.createElement('option'); option.value = model.id; option.textContent = model.name; select.appendChild(option);
      });
      // const defaultOption = [...select.options].find(option => option.value === 'google/gemma-4-26b-a4b-it:free')
      //   || [...select.options].find(option => option.value === 'google/gemma-4-31b-it:free');
      // if (defaultOption) select.value = defaultOption.value;
      // help.textContent = payload.note || 'Verify current availability and the model license.';


      if (select.options.length) {
  select.selectedIndex = 0;
}
    // } catch {
    //   select.innerHTML = '<option value="google/gemma-4-26b-a4b-it:free">Gemma 4 26B A4B IT · Apache 2.0 (fallback)</option><option value="google/gemma-4-31b-it:free">Gemma 4 31B IT · Apache 2.0 (fallback)</option>';
    //   $('#modelHelp').textContent = 'Could not load the live list. Gemma 4 is the suggested fallback, but the provider may be busy or the model may be unavailable. Hosted inference needs internet; it is not offline.';
    // }


    } catch {
  select.innerHTML =
    '<option value="">Model list unavailable</option>';

  $('#modelHelp').textContent =
    'Could not load the model list. Click Refresh models or enter a supported non-Google :free model ID.';
}
    modelsLoaded = true;
  }

  function collectPreferences() {
    return {
      city: $('#planCity').value.trim() || data.city || 'Ahmedabad',
      activity: $('#planActivity').value,
      mood: $('#planMood').value,
      duration: Number($('#planDuration').value),
      fitness: $('#planFitness').value,
      group: $('#planGroup').value,
      vibe: $('#planVibe').value,
      language: LANGUAGE_NAMES[activeLanguage] || 'English',
    };
  }
  function renderPlan(plan, source, modelId, message) {
    lastPlan = { ...plan, source, model: modelId || '', preferences: collectPreferences() };
    activePlanLogged = false;
    const planCard = $('#planOutputCard');
    const sourceLabel = source !== 'openrouter' ? 'DEMO MODE · LOCAL TEMPLATE' : (String(modelId || '').startsWith('google/gemma-4-') ? `GEMMA 4 · APACHE 2.0 · HOSTED · ${modelId}` : `HOSTED MODEL · VERIFY LICENSE · ${modelId || 'OpenRouter'}`);
    const steps = (plan.steps || []).map((step, index) => `
      <div class="step-row"><div class="step-timeline"><span></span>${index < (plan.steps.length - 1) ? '<i></i>' : ''}</div><div class="step-main"><span class="step-time">${escapeHtml(step.time || `Step ${index+1}`)}</span><strong>${escapeHtml(step.title || 'Outdoor activity')}</strong><p>${escapeHtml(step.detail || '')}</p></div></div>`).join('');
    const checklist = (plan.checklist || []).map((item, index) => `<label class="check-item"><input type="checkbox" data-pack-item="${index}"><span>${escapeHtml(item)}</span></label>`).join('');
    const safety = (plan.safety || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    planCard.innerHTML = `
      <div class="plan-output-full">
        <div class="plan-output-hero"><span class="plan-source-badge"><i data-lucide="${source === 'openrouter' ? 'brain-circuit' : 'sparkles'}"></i> ${escapeHtml(sourceLabel)}</span><h3>${escapeHtml(plan.title || 'Your outdoor plan')}</h3><p>${escapeHtml(plan.summary || '')}</p></div>
        <div class="plan-output-content">
          ${message ? `<div class="note-banner" style="margin:0 0 14px;padding:10px 12px"><i data-lucide="info"></i><p>${escapeHtml(message)}</p></div>` : ''}
          <section class="plan-output-section"><h4><i data-lucide="clock-3"></i> Best time to go</h4><p class="plan-summary">${escapeHtml(plan.best_time || 'Check local conditions before you leave.')}</p></section>
          <section class="plan-output-section"><h4><i data-lucide="route"></i> Your step-by-step plan</h4><div class="step-list">${steps}</div></section>
          <section class="plan-output-section"><h4><i data-lucide="backpack"></i> What to bring</h4><div class="check-items">${checklist}</div></section>
          <section class="plan-output-section"><div class="challenge-box"><strong><i data-lucide="smartphone"></i> Screen-free challenge</strong>${escapeHtml(plan.screen_free_challenge || 'Put your phone away for the first 10 minutes.')}</div></section>
          <section class="plan-output-section"><h4><i data-lucide="shield-check"></i> A few safety notes</h4><ul class="safety-list">${safety}</ul></section>
          <section class="plan-output-section"><h4><i data-lucide="sprout"></i> A little nature thought</h4><p class="plan-summary">${escapeHtml(plan.nature_fact || '')}</p></section>
          <div class="plan-output-actions"><button class="button button-outline" id="downloadPlan"><i data-lucide="download"></i> Save plan</button><button class="button button-primary" id="completePlan"><i data-lucide="check-circle-2"></i> I went outside</button></div>
          <p class="form-note"><i data-lucide="info"></i> Plans are suggestions. Check local conditions and trust your own judgement.</p>
        </div>
      </div>`;
    icons();
    $('#downloadPlan').addEventListener('click', downloadLastPlan);
    $('#completePlan').addEventListener('click', () => {
      if (!lastPlan || activePlanLogged) return;
      const moodBefore = lastPlan.preferences?.mood || 'Okay';
      const moodAfter = Math.min(10, (moodNumbers[moodBefore] || 6) + 1);
      logOuting({ title: lastPlan.title, activity: lastPlan.preferences?.activity || 'Outdoor outing', duration: lastPlan.preferences?.duration || 45, moodBefore, moodAfter });
      activePlanLogged = true;
      $('#completePlan').disabled = true; $('#completePlan').innerHTML = '<i data-lucide="check-circle-2"></i> Outing logged'; icons();
      notify('Nice work. Your outing has been added to My Progress.');
    });
  }
  function downloadLastPlan() {
    if (!lastPlan) return;
    const plan = lastPlan;
    const text = [plan.title, '='.repeat(String(plan.title || '').length), '', plan.summary, '', `Best time: ${plan.best_time}`, '', 'PLAN', ...(plan.steps || []).map(step => `${step.time}: ${step.title}\n${step.detail}`), '', 'WHAT TO BRING', ...(plan.checklist || []).map(item => `- ${item}`), '', 'SCREEN-FREE CHALLENGE', plan.screen_free_challenge, '', 'SAFETY NOTES', ...(plan.safety || []).map(item => `- ${item}`), '', 'NATURE THOUGHT', plan.nature_fact].join('\n');
    downloadBlob(text, 'touch-grass-outdoor-plan.txt', 'text/plain');
  }
  function downloadBlob(contents, filename, mime) {
    const blob = new Blob([contents], { type: `${mime};charset=utf-8` }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  async function generatePlan(event) {
    event.preventDefault();
    const prefs = collectPreferences();
    const button = $('#generatePlanButton'); const original = button.innerHTML;
    button.disabled = true; button.innerHTML = '<i data-lucide="loader-circle"></i> Making your plan…'; icons();
    if (prefs.city.toLowerCase() !== (data.city || '').toLowerCase()) await fetchWeather(prefs.city);
    const rawKey = $('#openRouterKey').value.trim();
    const modelId = $('#manualModelId').value.trim() || $('#aiModel').value;
    const weather = weatherData?.place?.name?.toLowerCase() === prefs.city.toLowerCase() ? weatherData.current : null;
    try {
      const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ preferences: prefs, api_key: rawKey, model: modelId, weather }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Plan generation failed.');
      renderPlan(payload.plan || {}, payload.source || 'demo', payload.model || modelId, payload.message || '');
      if (payload.source === 'openrouter') notify('Your plan was generated through the selected OpenRouter model.');
      else notify('Your plan is ready in demo mode. Add your key for model-generated plans.');
    } catch (error) {
      notify(error.message || 'Could not create a plan.', 'error');
    } finally { button.disabled = false; button.innerHTML = original; icons(); }
  }

  async function loadParks(city = $('#parkCity').value || data.city) {
    const cleanCity = city.trim() || 'Ahmedabad';
    const leafletReady = ensureLeaflet();
    setText('#parkMapCaption', `Searching green spaces near ${cleanCity}…`);
    $('#parkList').innerHTML = '<div class="empty-state card"><i data-lucide="loader-circle"></i><strong>Looking for green spaces</strong><span>Loading community map data. This can take a few seconds.</span></div>'; icons();
    const search = $('#searchParks'); search.disabled = true; const original = search.innerHTML; search.innerHTML = '<i data-lucide="loader-circle"></i> Searching'; icons();
    try {
      const response = await fetch(`/api/parks?city=${encodeURIComponent(cleanCity)}`, { cache: 'no-store' });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Park search failed.');
      parkData = payload.parks || [];
      $('#parkCity').value = cleanCity;
      renderParkList();
      await leafletReady;
      renderParkMap(payload);
      if (!parkData.length) notify(`No named parks were returned for ${cleanCity}. Try another city or check later.`, 'error');
    } catch (error) {
      parkData = [];
      $('#parkList').innerHTML = `<div class="empty-state card"><i data-lucide="map-pin-off"></i><strong>Could not load park data</strong><span>${escapeHtml(error.message || 'The map service is unavailable. Try again later.')}</span></div>`;
      setText('#parkMapCaption', 'Map data unavailable');
      notify(error.message || 'Could not load parks.', 'error');
    } finally { search.disabled = false; search.innerHTML = original; icons(); }
  }
  function renderParkList() {
    const mode = $('#parkSort').value;
    const parks = [...parkData].sort((a,b) => mode === 'name' ? a.name.localeCompare(b.name) : a.distance_km - b.distance_km);
    setText('#parkCount', `${parks.length} ${parks.length === 1 ? 'place' : 'places'} found`);
    if (!parks.length) {
      $('#parkList').innerHTML = '<div class="empty-state card"><i data-lucide="trees"></i><strong>No named green spaces found</strong><span>Try another nearby city. OpenStreetMap coverage varies by location.</span></div>';
      icons(); return;
    }
    $('#parkList').innerHTML = parks.map((park, index) => `
      <article class="card park-item"><div class="park-thumb"><i data-lucide="${index % 3 === 0 ? 'trees' : index % 3 === 1 ? 'flower-2' : 'sprout'}"></i></div><div class="park-item-content"><h4 title="${escapeHtml(park.name)}">${escapeHtml(park.name)}</h4><p>${escapeHtml(park.kind || 'Green space')} · ${numberText(park.distance_km, ' km')} from city centre</p><div class="park-tags"><span>OpenStreetMap</span><span>Outdoor spot</span></div></div><a class="park-view" href="${escapeHtml(park.map_url)}" target="_blank" rel="noopener noreferrer" aria-label="Open map for ${escapeHtml(park.name)}"><i data-lucide="arrow-up-right"></i></a></article>`).join('');
    icons();
  }
  function renderParkMap(payload = null) {
    const container = $('#parkMap'); if (!container) return;
    if (!window.L) {
      container.innerHTML = '<div class="map-placeholder"><i data-lucide="map"></i><span>Map library is unavailable</span><small>Check your internet connection.</small></div>'; icons(); return;
    }
    if (!parkMap) {
      container.innerHTML = '';
      const center = payload?.center ? [payload.center.latitude, payload.center.longitude] : weatherData?.place ? [weatherData.place.latitude, weatherData.place.longitude] : [23.0225, 72.5714];
      parkMap = L.map(container, { scrollWheelZoom: false }).setView(center, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(parkMap);
      parkMarkers = L.featureGroup().addTo(parkMap);
    }
    setTimeout(() => parkMap?.invalidateSize(), 80);
    parkMarkers.clearLayers();
    parkData.forEach(park => {
      const icon = L.divIcon({ className: 'tg-map-marker-wrap', html: '<span style="display:block;width:18px;height:18px;background:#2e9b55;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(20,65,35,.35)"></span>', iconSize: [18,18], iconAnchor: [9,9] });
      const marker = L.marker([park.latitude, park.longitude], { icon }).addTo(parkMarkers);
      marker.bindPopup(`<strong>${escapeHtml(park.name)}</strong><br>${numberText(park.distance_km, ' km')} away<br><a target="_blank" rel="noopener" href="${escapeHtml(park.map_url)}">Open in OpenStreetMap</a>`);
    });
    if (parkMarkers.getLayers().length) parkMap.fitBounds(parkMarkers.getBounds().pad(0.12));
    else if (payload?.center) parkMap.setView([payload.center.latitude, payload.center.longitude], 12);
    else if (weatherData?.place) parkMap.setView([weatherData.place.latitude, weatherData.place.longitude], 12);
    setText('#parkMapCaption', payload?.city ? `Green spaces around ${payload.city}` : `${parkData.length} green spaces on the map`);
  }

  function makeBingoCard() {
    const shuffled = [...bingoPool].sort(() => Math.random() - 0.5).slice(0,9);
    bingo = { items: shuffled, found: [], awarded: false, rounds: (bingo?.rounds || 0) + 1 };
    persistBingo(); renderBingo();
  }
  function renderBingo() {
    if (!bingo || !Array.isArray(bingo.items) || bingo.items.length !== 9) makeBingoCard();
    const grid = $('#bingoGrid'); if (!grid) return;
    const found = new Set(bingo.found || []);
    grid.innerHTML = bingo.items.map((item, index) => `
      <button class="bingo-tile ${found.has(index) ? 'checked' : ''}" data-bingo-index="${index}" role="checkbox" aria-checked="${found.has(index)}"><span class="bingo-check"><i data-lucide="${found.has(index) ? 'check' : 'plus'}"></i></span><span class="bingo-tile-emoji">${item.emoji}</span><span class="bingo-tile-label">${escapeHtml(item.label)}</span></button>`).join('');
    setText('#bingoCount', String(found.size));
    $('#bingoProgressBar').style.width = `${(found.size/9)*100}%`;
    $('#bingoWin').classList.toggle('hidden', !bingo.awarded);
    $$('[data-bingo-index]').forEach(button => button.addEventListener('click', () => toggleBingo(Number(button.dataset.bingoIndex))));
    icons();
  }
  function toggleBingo(index) {
    const found = new Set(bingo.found || []);
    if (found.has(index)) found.delete(index); else found.add(index);
    bingo.found = [...found];
    if (found.size === 9 && !bingo.awarded) {
      bingo.awarded = true; data.points = (Number(data.points) || 0) + 20; data.bingosCompleted = (Number(data.bingosCompleted) || 0) + 1; persist(); notify('Nature Bingo complete! +20 grass points.');
    }
    persistBingo(); renderBingo(); renderProgress();
  }

  function logOuting({ title = 'Outdoor outing', activity = 'Outdoor activity', duration = 30, moodBefore = 'Okay', moodAfter = 7 }) {
    const session = { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, date: todayISO(), title, activity, minutes: Number(duration) || 30, moodBefore: moodNumbers[moodBefore] || 6, moodAfter: Number(moodAfter) || 7, points: Math.max(10, 10 + Math.floor((Number(duration) || 30)/10)), time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) };
    data.sessions.unshift(session); data.points = (Number(data.points) || 0) + session.points; data.completedMissions = (Number(data.completedMissions) || 0) + 1;
    persist(); renderProgress();
    notify(`Outing logged. +${session.points} grass points!`);
  }
  function calcStreak(sessions) {
    const dateSet = new Set((sessions || []).map(item => item.date));
    const today = new Date(); today.setHours(0,0,0,0);
    const iso = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    if (!dateSet.has(iso(today))) today.setDate(today.getDate()-1);
    let count = 0;
    while (dateSet.has(iso(today)) && count < 365) { count++; today.setDate(today.getDate()-1); }
    return count;
  }
  function weeklyMinutes(sessions = data.sessions) {
    const today = new Date(); today.setHours(0,0,0,0); const cutoff = new Date(today); cutoff.setDate(today.getDate()-6);
    return sessions.filter(session => { const date = new Date(`${session.date}T00:00:00`); return date >= cutoff && date <= today; }).reduce((sum, session) => sum + (Number(session.minutes)||0), 0);
  }
  function weekSeries() {
    const today = new Date(); today.setHours(0,0,0,0); const days = [];
    for (let offset = 6; offset >= 0; offset--) {
      const day = new Date(today); day.setDate(today.getDate()-offset);
      const key = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
      days.push({ key, label: day.toLocaleDateString(uiLocale(),{weekday:'short'}), value: data.sessions.filter(s => s.date === key).reduce((sum,s)=>sum+(Number(s.minutes)||0),0) });
    }
    return days;
  }
  function renderProgress() {
    const sessions = data.sessions || []; const streak = calcStreak(sessions); const totalMinutes = sessions.reduce((sum,s)=>sum+(Number(s.minutes)||0),0); const weekly = weeklyMinutes(sessions);
    setText('#progressPoints', String(data.points || 0)); setText('#progressStreak', String(streak)); setText('#progressHours', (totalMinutes/60).toFixed(1)); setText('#progressOutings', String(sessions.length));
    setText('#weeklyMinutes', String(weekly)); setText('#weeklyGoalText', String(data.weeklyGoal || 150));
    $('#weeklyGoalBar').style.width = `${Math.min(100, weekly/(data.weeklyGoal||150)*100)}%`;
    $('#weeklyGoal').value = String(data.weeklyGoal || 150);
    const last = sessions[0];
    if (last) {
      setText('#lastMoodLabel', last.moodAfter >= 8 ? 'Feeling great' : last.moodAfter >= 6 ? 'Feeling better' : last.moodAfter >= 4 ? 'About the same' : 'A tough day');
      setText('#lastMoodDetail', `Mood score after outing: ${last.moodAfter}/10`);
      setText('#lastMoodFace', last.moodAfter >= 8 ? '🤩' : last.moodAfter >= 6 ? '🙂' : last.moodAfter >= 4 ? '😐' : '😮‍💨');
      $('#moodScaleMarker').style.left = `${Math.max(0,Math.min(100,(last.moodAfter-1)/9*100))}%`;
    } else {
      setText('#lastMoodLabel','Not logged yet');setText('#lastMoodDetail','Finish an outing to record how you feel.');setText('#lastMoodFace','🙂');$('#moodScaleMarker').style.left='50%';
    }
    const achievements = [
      { title:'First step', desc:'Log your first outdoor outing.', emoji:'🌱', unlocked:sessions.length>=1 },
      { title:'Nature explorer', desc:'Complete 5 outdoor outings.', emoji:'🧭', unlocked:sessions.length>=5 },
      { title:'Three-day rhythm', desc:'Keep a 3-day outing streak.', emoji:'🔥', unlocked:streak>=3 },
      { title:'Weekly goal', desc:'Reach your weekly outdoor goal.', emoji:'🎯', unlocked:weekly >= (data.weeklyGoal||150) },
      { title:'Bingo master', desc:'Complete a Nature Bingo card.', emoji:'🦋', unlocked:(Number(data.bingosCompleted)||0)>=1 },
      { title:'One hour outside', desc:'Log 60 minutes outdoors in total.', emoji:'🌳', unlocked:totalMinutes>=60 },
    ];
    $('#achievementGrid').innerHTML = achievements.map(item => `<article class="achievement-card ${item.unlocked?'':'locked'}"><span class="achievement-icon">${item.emoji}</span><div class="achievement-copy"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.desc)}</p></div><span class="achievement-state">${item.unlocked?'UNLOCKED':'LOCKED'}</span></article>`).join('');
    const history = $('#outingHistory');
    if (!sessions.length) history.innerHTML = '<div class="empty-state"><i data-lucide="footprints"></i><strong>Your story starts with one step.</strong><span>Generate a plan and log your first outing.</span></div>';
    else history.innerHTML = sessions.slice(0,12).map(session => `<div class="history-row"><span class="history-icon"><i data-lucide="${activityIcons[session.activity] || 'leaf'}"></i></span><div class="history-main"><strong>${escapeHtml(session.title || session.activity || 'Outdoor outing')}</strong><span>${escapeHtml(session.date || '')} · ${escapeHtml(session.time || '')} · ${Number(session.minutes)||0} min · mood ${Number(session.moodAfter)||'—'}/10</span></div><span class="history-points">+${Number(session.points)||0} pts</span><button class="history-delete" data-delete-session="${escapeHtml(session.id)}" aria-label="Delete outing"><i data-lucide="x"></i></button></div>`).join('');
    $$('[data-delete-session]').forEach(button => button.addEventListener('click', () => { const id=button.dataset.deleteSession; data.sessions=data.sessions.filter(s=>s.id!==id); persist(); renderProgress(); notify('Outing removed from your local history.'); }));
    renderWeeklyChart(); icons();
  }
  function renderWeeklyChart() {
    const canvas = $('#weeklyMinutesChart'); if (!canvas || !window.Chart) return;
    const series = weekSeries(); const empty = $('#weeklyMinutesEmpty');
    if (empty) empty.style.display = data.sessions.length ? 'none' : 'grid';
    if (chartInstances.weekly) chartInstances.weekly.destroy();
    chartInstances.weekly = new Chart(canvas.getContext('2d'), {
      type:'bar', data:{labels:series.map(x=>x.label),datasets:[{label:translatedPhrase('Minutes outdoors'),data:series.map(x=>x.value),backgroundColor:series.map(x=>x.value>0?'#70c77d':'#e8f1e6'),borderRadius:7,borderSkipped:false,maxBarThickness:25}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#153f31',padding:10,displayColors:false,callbacks:{label:item=>` ${item.raw} minutes`}}},scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#91a497',font:{family:'DM Sans',size:9}}},y:{beginAtZero:true,grid:{color:'#edf2ec',drawTicks:false},border:{display:false,dash:[4,4]},ticks:{color:'#91a497',font:{family:'DM Sans',size:9},padding:8,precision:0}}}}
    });
  }

  function initMapSearch() {
    $('#searchParks').addEventListener('click', () => loadParks($('#parkCity').value || data.city));
    $('#parkCity').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); loadParks($('#parkCity').value); } });
    $('#parkSort').addEventListener('change', renderParkList);
  }
  function initPlanner() {
    $('#plannerForm').addEventListener('submit', generatePlan);
    $('#openRouterKey').addEventListener('input', () => $('#aiConnectionDot').classList.toggle('connected', !!$('#openRouterKey').value.trim()));
    $('#refreshModels').addEventListener('click', () => loadModels(true));
    document.querySelector('.ai-settings')?.addEventListener('toggle', event => { if (event.target.open && !modelsLoaded) loadModels(); });
  }
  function initProgress() {
    $('#weeklyGoal').addEventListener('change', () => { data.weeklyGoal = Number($('#weeklyGoal').value)||150; persist(); $('#profileWeeklyGoal').value=String(data.weeklyGoal); renderProgress(); notify('Weekly goal updated.'); });
    $('#exportProgress').addEventListener('click', exportData);
    $('#downloadPrivacyData').addEventListener('click', exportData);
    $('#clearProgress').addEventListener('click', () => {
      if (!window.confirm('Clear all locally saved outings and points? This cannot be undone.')) return;
      data.sessions=[];data.points=0;data.completedMissions=0;data.bingosCompleted=0;persist();renderProgress();notify('Local progress cleared.');
    });
  }
  function exportData() { downloadBlob(JSON.stringify({ exportedAt:new Date().toISOString(), profile:{name:data.profileName,city:data.city,weeklyGoal:data.weeklyGoal}, points:data.points, sessions:data.sessions, completedMissions:data.completedMissions, bingosCompleted:data.bingosCompleted }, null, 2), 'touch-grass-progress.json', 'application/json'); }
  function initProfile() {
    $('#saveProfile').addEventListener('click', () => {
      const name=$('#profileNameInput').value.trim(); const city=$('#profileCityInput').value.trim();
      if (!name) { notify('Enter a display name first.', 'error'); return; }
      if (!city) { notify('Enter your default city first.', 'error'); return; }
      data.profileName=name;data.city=city;data.weeklyGoal=Number($('#profileWeeklyGoal').value)||150;persist();setProfileUI();fetchWeather(city);notify('Your preferences have been saved in this browser.');
    });
  }

  function init() {
    initAccessibility();
    setProfileUI(); bindNavigation(); initMapSearch(); initPlanner(); initProgress(); initProfile();
    if (!bingo || !Array.isArray(bingo.items) || bingo.items.length !== 9) makeBingoCard(); else renderBingo();
    renderProgress();
    fetchWeather(data.city || 'Ahmedabad');
    icons();
    ensureLucide();
    scheduleChartLoad();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
