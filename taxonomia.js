/* Taxonomia de etiquetas del Mando (heredada de MusicVault, agosto 2026):
   471 etiquetas en siete ejes (generos, subgeneros, ambiente, origen, decada,
   epocas e hitos) y las listas hechas a mano de los hitos. Necesita fold()
   del Mando, que se carga despues. */
const LASTFM_RUIDO = new Set(['seen live', 'favorite', 'favorites', 'favourite', 'favourites', 'spotify', 'albums i own', 'vinyl', 'cd', 'under 2000 listeners']);
/* Spotify guarda el genero en ingles y suelto: "Big Room", "Edm Trap", "rnb",
   1.497 cadenas distintas en este vault. Sueltas no sirven de nada. Esta tabla
   las agrupa en cinco ejes con nombre en castellano:

     genero    las familias grandes (Rock, House, Rap...)
     sub       el subgenero concreto (G-house, Boom bap, Drift phonk...)
     ambiente  para que sirve, no que es (Para el gimnasio, De madrugada...)
     origen    de donde viene (Andalucia, Detroit, Brasil...)
     decada    el unico que no adivina: sale del ano de lanzamiento

   Cada clave se compara por PALABRA ENTERA. Sin eso "rap" saltaria dentro de
   "grape juice" y "trap" haria saltar tambien "rap". */
const TAXONOMIA = [
  /* ---------- FAMILIAS (42) ---------- */
  {g:'genero',n:"Electrónica",i:'rayo',c:'#7a5cd6',k:["edm","electronic","electronica","electro","dance","club","rave","dj"]},
  {g:'genero',n:"House",i:'disco',c:'#5b8cf0',k:["house"]},
  {g:'genero',n:"Techno",i:'engranaje',c:'#4a5568',k:["techno","tekno"]},
  {g:'genero',n:"Trance",i:'espiral',c:'#8b7ce8',k:["trance"]},
  {g:'genero',n:"Dubstep y bass",i:'onda',c:'#2b9c8a',k:["dubstep","riddim","bass music","brostep","deathstep","drumstep","bassline","melodic bass","bass"]},
  {g:'genero',n:"Drum and bass",i:'onda',c:'#c0533f',k:["drum and bass","drum n bass","dnb","jungle","liquid funk","neurofunk","breakcore"]},
  {g:'genero',n:"Hardstyle y hardcore",i:'martillo',c:'#b8202e',k:["hardstyle","hardcore techno","gabber","frenchcore","speedcore","uptempo","happy hardcore","rawstyle","hard dance","hard techno"]},
  {g:'genero',n:"Rap y hip-hop",i:'microfono',c:'#eb6834',k:["hip hop","hip-hop","hiphop","rap","boom bap","crunk","drill","grime"]},
  {g:'genero',n:"Trap",i:'niebla',c:'#8a4a2e',k:["trap","phonk","plugg","rage rap"]},
  {g:'genero',n:"Pop",i:'estrella',c:'#e87ba4',k:["pop"]},
  {g:'genero',n:"Rock",i:'guitarra',c:'#e34948',k:["rock","rock and roll","rock n roll","rockabilly"]},
  {g:'genero',n:"Metal",i:'calavera',c:'#4c4a52',k:["metal","metalcore","djent","doom","grindcore"]},
  {g:'genero',n:"Punk",i:'rayo',c:'#d1394f',k:["punk","oi","anarcho"]},
  {g:'genero',n:"Indie y alternativo",i:'marcador',c:'#3f9c35',k:["indie","alternative","lo-fi","lofi","bedroom pop","slacker"]},
  {g:'genero',n:"R&B y soul",i:'corazon',c:'#2a78d6',k:["rnb","r&b","soul","rhythm and blues","motown","quiet storm","new jack swing"]},
  {g:'genero',n:"Funk y disco",i:'disco',c:'#d98c1f',k:["funk","disco","boogie","p-funk","g-funk","hi-nrg"]},
  {g:'genero',n:"Jazz",i:'nota',c:'#1baf7a',k:["jazz","bebop","swing","swing music","big band","bossa nova","fusion","saxophone","sax","trumpet","saxofon","trompeta"]},
  {g:'genero',n:"Blues",i:'onda',c:'#3a5f8a',k:["blues","delta blues","soul blues"]},
  {g:'genero',n:"Clásica",i:'libro',c:'#8a6a4a',k:["classical","clasica","orchestral","orchestra","opera","baroque","romanticism","chamber music","concerto","symphony","early music","contemporary classical","composer","composers","compositor"]},
  {g:'genero',n:"Country y folk",i:'casa',c:'#a3690f',k:["country","folk","americana","bluegrass","singer-songwriter","cantautor","chanson","trova"]},
  {g:'genero',n:"Reggae y dancehall",i:'gota',c:'#3f9c35',k:["reggae","dancehall","ska","dub","ragga","rocksteady","soca"]},
  {g:'genero',n:"Latino",i:'copa',c:'#eda100',k:["latin","latino","salsa","bachata","cumbia","merengue","mambo","son cubano","bolero","vallenato","tropical"]},
  {g:'genero',n:"Reggaetón y urbano",i:'fuego',c:'#e0563a',k:["reggaeton","urbano latino","dembow","perreo","neoperreo","urbano","pop urbaine"]},
  {g:'genero',n:"Regional mexicano",i:'corona',c:'#b5761c',k:["corrido","corridos","banda","ranchera","mariachi","musica mexicana","norteno","sierreno","regional mexican"]},
  {g:'genero',n:"Flamenco",i:'abanico',c:'#b03f30',k:["flamenco","rumba","copla","sevillanas","cante"]},
  {g:'genero',n:"Electropop y synth",i:'teclado',c:'#a05cc0',k:["synthpop","synth pop","synthwave","electropop","electroclash","italo disco","italo dance","new wave","hyperpop","indietronica","synth","moog","synthesizer"]},
  {g:'genero',n:"Ambient y experimental",i:'niebla',c:'#6b7b8c',k:["ambient","experimental","drone","idm","glitch","noise","avant-garde","musique concrete","minimal","new age","downtempo","trip hop","trip-hop"]},
  {g:'genero',n:"Bandas sonoras",i:'pelicula',c:'#726858',k:["soundtrack","score","ost","video game","disney","musical","anime"]},
  {g:'genero',n:"Gospel y espiritual",i:'casa',c:'#9a7b3f',k:["gospel","worship","christian","spiritual"]},
  {g:'genero',n:"Africano",i:'sol',c:'#c98a1f',k:["afrobeat","afrobeats","afro house","amapiano","highlife","afropop"]},
  {g:'genero',n:"Brasileño",i:'palmera',c:'#2f9e5e',k:["brazilian","brasil","samba","mpb","forro","pagode","funk carioca","brazilian funk","brazilian bass","brazilian phonk"]},
  {g:'genero',n:"Asiático",i:'flor',c:'#d4568a',k:["k-pop","j-pop","j-rock","c-pop","city pop","mandopop","bollywood"]},
  {g:'genero',n:"Navidad",i:'arbol',c:'#2f8f4e',k:["christmas","villancicos","navidad","holiday"]},
  {g:'genero',n:"Rarezas",i:'estrella',c:'#7f8fa0',k:["comedy","childrens music","parody","spoken word","podcast","meme","novelty"]},
  {g:'genero',n:"Breaks y garage",i:'onda',c:'#3f8fa8',k:["breakbeat","breaks","big beat","uk garage","2-step","2step","speed garage","future garage","uk funky","bassline","jersey club","baltimore club","ghettotech","juke","footwork","nu skool breaks"]},
  {g:'genero',n:"Chill y downtempo",i:'nube',c:'#5f8f9c',k:["downtempo","chillout","chill out","chill-out","chillwave","lounge","easy listening","easy-listening","electronic-lounge","balearic","exotica","chill","chillhop"]},
  {g:'genero',n:"Industrial y gótico",i:'glitch',c:'#55505c',k:["industrial","ebm","darkwave","coldwave","goth","gothic","gothic rock","deathrock","industrial metal","industrial techno","aggrotech","witch house","neofolk","minimal wave"]},
  {g:'genero',n:"Musicales y teatro",i:'copa',c:'#a05c7a',k:["musicals","musical","broadway","ballet","opera","operetta","zarzuela","show tunes","disney","west end","soundtrack musical"]},
  {g:'genero',n:"Hyperpop y digital",i:'glitch',c:'#d45cc0',k:["hyperpop","glitchcore","digicore","nightcore","bubblegum bass","pc music","sigilkore","dariacore","sped up"]},
  {g:'genero',n:"Comedia y parodia",i:'chispa',c:'#c9a227',k:["comedy","parody","novelty","humor","humour","comedia","parodia","funny"]},
  {g:'genero',n:"Palabra hablada",i:'libro',c:'#7a7060',k:["spoken word","poetry","poesia","audiobook","monologo","skit","slam"]},
  {g:'genero',n:"Infantil y animación",i:'flor',c:'#3aa8c0',k:["disney","anime","cartoon","childrens music","infantil","pixar","dibujos animados","theme song","themes"]},

  /* ---------- SUBGENEROS (304) ---------- */
  {g:'sub',n:"Big room",i:'onda',c:'#5b8cf0',k:["big room","bigroom"],p:"House"},
  {g:'sub',n:"Progressive house",i:'onda',c:'#5b8cf0',k:["progressive house"],p:"House"},
  {g:'sub',n:"Electro house",i:'onda',c:'#5b8cf0',k:["electro house","electro-house","complextro","dutch house"],p:"House"},
  {g:'sub',n:"Future house",i:'onda',c:'#5b8cf0',k:["future house"],p:"House"},
  {g:'sub',n:"Bass house",i:'onda',c:'#5b8cf0',k:["bass house","g-house","ghouse"],p:"House"},
  {g:'sub',n:"Deep house",i:'onda',c:'#5b8cf0',k:["deep house"],p:"House"},
  {g:'sub',n:"Tech house",i:'onda',c:'#5b8cf0',k:["tech house"],p:"House"},
  {g:'sub',n:"Tropical house",i:'palmera',c:'#5b8cf0',k:["tropical house"],p:"House"},
  {g:'sub',n:"Slap house",i:'onda',c:'#5b8cf0',k:["slap house"],p:"House"},
  {g:'sub',n:"Melodic house",i:'onda',c:'#5b8cf0',k:["melodic house"],p:"House"},
  {g:'sub',n:"Afro house",i:'sol',c:'#5b8cf0',k:["afro house"],p:"House"},
  {g:'sub',n:"Latin house",i:'copa',c:'#5b8cf0',k:["latin house","tribal house"],p:"House"},
  {g:'sub',n:"French house",i:'bandera',c:'#5b8cf0',k:["french house","filter house"],p:"House"},
  {g:'sub',n:"Disco house",i:'disco',c:'#5b8cf0',k:["disco house","nu disco","funky house"],p:"House"},
  {g:'sub',n:"Acid house",i:'gota',c:'#5b8cf0',k:["acid house"],p:"House"},
  {g:'sub',n:"Chicago house",i:'casa',c:'#5b8cf0',k:["chicago house"],p:"House"},
  {g:'sub',n:"Hip house",i:'microfono',c:'#5b8cf0',k:["hip house"],p:"House"},
  {g:'sub',n:"Melbourne bounce",i:'espiral',c:'#5b8cf0',k:["melbourne bounce","bounce"],p:"House"},
  {g:'sub',n:"Rally house",i:'coche',c:'#5b8cf0',k:["rally house"],p:"House"},
  {g:'sub',n:"Minimal techno",i:'engranaje',c:'#4a5568',k:["minimal techno","minimal"],p:"Techno"},
  {g:'sub',n:"Hard techno",i:'engranaje',c:'#4a5568',k:["hard techno","hypertechno","schranz"],p:"Techno"},
  {g:'sub',n:"Melodic techno",i:'engranaje',c:'#4a5568',k:["melodic techno"],p:"Techno"},
  {g:'sub',n:"Acid techno",i:'gota',c:'#4a5568',k:["acid techno","acid"],p:"Techno"},
  {g:'sub',n:"Detroit techno",i:'engranaje',c:'#4a5568',k:["detroit techno"],p:"Techno"},
  {g:'sub',n:"Psytrance",i:'espiral',c:'#8b7ce8',k:["psytrance","psychedelic trance","goa trance","goa","darkpsy","psycore","forest psy","full-on"],p:"Trance"},
  {g:'sub',n:"Progressive trance",i:'espiral',c:'#8b7ce8',k:["progressive trance"],p:"Trance"},
  {g:'sub',n:"Uplifting trance",i:'espiral',c:'#8b7ce8',k:["uplifting trance","vocal trance"],p:"Trance"},
  {g:'sub',n:"Eurodance",i:'disco',c:'#8b7ce8',k:["eurodance","europop"],p:"Trance"},
  {g:'sub',n:"Riddim",i:'onda',c:'#2b9c8a',k:["riddim"],p:"Dubstep y bass"},
  {g:'sub',n:"Deathstep",i:'calavera',c:'#2b9c8a',k:["deathstep","tearout"],p:"Dubstep y bass"},
  {g:'sub',n:"Melodic dubstep",i:'onda',c:'#2b9c8a',k:["melodic dubstep","melodic bass"],p:"Dubstep y bass"},
  {g:'sub',n:"Chillstep",i:'nube',c:'#2b9c8a',k:["chillstep"],p:"Dubstep y bass"},
  {g:'sub',n:"Drumstep",i:'onda',c:'#2b9c8a',k:["drumstep"],p:"Dubstep y bass"},
  {g:'sub',n:"Future bass",i:'onda',c:'#2b9c8a',k:["future bass"],p:"Dubstep y bass"},
  {g:'sub',n:"Trap electrónico",i:'niebla',c:'#2b9c8a',k:["edm trap","festival trap","hybrid trap"],p:"Dubstep y bass"},
  {g:'sub',n:"Moombahton",i:'copa',c:'#2b9c8a',k:["moombahton","moombahcore"],p:"Dubstep y bass"},
  {g:'sub',n:"Glitch hop",i:'glitch',c:'#2b9c8a',k:["glitch hop","wonky","neurohop"],p:"Dubstep y bass"},
  {g:'sub',n:"Breakbeat",i:'onda',c:'#2b9c8a',k:["breakbeat","big beat","breaks","nu skool breaks"],p:"Dubstep y bass"},
  {g:'sub',n:"UK garage",i:'caja',c:'#2b9c8a',k:["uk garage","garage","2-step","uk funky","future garage","speed garage"],p:"Dubstep y bass"},
  {g:'sub',n:"Jersey club",i:'espiral',c:'#2b9c8a',k:["jersey club","baltimore club"],p:"Dubstep y bass"},
  {g:'sub',n:"Dub techno",i:'gota',c:'#2b9c8a',k:["dub techno"],p:"Dubstep y bass"},
  {g:'sub',n:"Liquid dnb",i:'gota',c:'#c0533f',k:["liquid funk","liquid dnb","liquid drum and bass","liquid"],p:"Drum and bass"},
  {g:'sub',n:"Neurofunk",i:'rayo',c:'#c0533f',k:["neurofunk","neuro"],p:"Drum and bass"},
  {g:'sub',n:"Jungle",i:'palmera',c:'#c0533f',k:["jungle","ragga jungle"],p:"Drum and bass"},
  {g:'sub',n:"Breakcore",i:'glitch',c:'#c0533f',k:["breakcore","digital hardcore"],p:"Drum and bass"},
  {g:'sub',n:"Gabber",i:'martillo',c:'#b8202e',k:["gabber","gabba"],p:"Hardstyle y hardcore"},
  {g:'sub',n:"Frenchcore",i:'martillo',c:'#b8202e',k:["frenchcore"],p:"Hardstyle y hardcore"},
  {g:'sub',n:"Speedcore",i:'martillo',c:'#b8202e',k:["speedcore","extratone"],p:"Hardstyle y hardcore"},
  {g:'sub',n:"Happy hardcore",i:'sol',c:'#b8202e',k:["happy hardcore","uk hardcore","makina"],p:"Hardstyle y hardcore"},
  {g:'sub',n:"Boom bap",i:'microfono',c:'#eb6834',k:["boom bap","old school hip hop","old school","golden age hip hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap de la Costa Este",i:'microfono',c:'#eb6834',k:["east coast hip hop","east coast","new york hip hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap de la Costa Oeste",i:'palmera',c:'#eb6834',k:["west coast hip hop","west coast"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap sureño",i:'microfono',c:'#eb6834',k:["southern hip hop","dirty south","southern rap","atlanta hip hop","memphis rap","houston rap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Gangsta rap",i:'calavera',c:'#eb6834',k:["gangsta rap","gangster rap","hardcore hip hop","mafioso rap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap consciente",i:'libro',c:'#eb6834',k:["conscious hip hop","conscious rap","political hip hop","jazz rap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap alternativo",i:'marcador',c:'#eb6834',k:["alternative hip hop","alternative rap","abstract hip hop","underground hip hop","underground hip-hop","experimental hip hop","experimental hip-hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap melódico",i:'corazon',c:'#eb6834',k:["melodic rap","emo rap","sad rap","cloud rap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Drill",i:'martillo',c:'#eb6834',k:["drill","uk drill","new york drill","brooklyn drill","chicago drill"],p:"Rap y hip-hop"},
  {g:'sub',n:"Grime",i:'microfono',c:'#eb6834',k:["grime","uk grime"],p:"Rap y hip-hop"},
  {g:'sub',n:"Horrorcore",i:'calavera',c:'#eb6834',k:["horrorcore","trap metal","rap metal","rapcore"],p:"Rap y hip-hop"},
  {g:'sub',n:"Instrumental hip-hop",i:'auriculares',c:'#eb6834',k:["instrumental hip hop","instrumental hip-hop","lofi hip hop","lo-fi hip hop","chillhop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap en español",i:'bandera',c:'#eb6834',k:["spanish hip hop","rap espanol","latin hip hop","rap en espanol","hip hop espanol"],p:"Rap y hip-hop"},
  {g:'sub',n:"Rap francés",i:'bandera',c:'#eb6834',k:["french rap","french hip hop","rap francais"],p:"Rap y hip-hop"},
  {g:'sub',n:"Pop rap",i:'estrella',c:'#eb6834',k:["pop rap","country rap","electro hop","crunk","swag"],p:"Rap y hip-hop"},
  {g:'sub',n:"Trap latino",i:'copa',c:'#8a4a2e',k:["trap latino","latin trap","argentine trap","trap argentino","trap chileno"],p:"Trap"},
  {g:'sub',n:"Phonk",i:'niebla',c:'#8a4a2e',k:["phonk","drift phonk","brazilian phonk","house phonk","chopped and screwed","screwed","slowed"],p:"Trap"},
  {g:'sub',n:"Rage",i:'fuego',c:'#8a4a2e',k:["rage rap","rage","opium"],p:"Trap"},
  {g:'sub',n:"Plugg",i:'rayo',c:'#8a4a2e',k:["plugg","pluggnb","plugnb"],p:"Trap"},
  {g:'sub',n:"Dance pop",i:'disco',c:'#e87ba4',k:["dance-pop","dance pop","pop dance"],p:"Pop"},
  {g:'sub',n:"Art pop",i:'chispa',c:'#e87ba4',k:["art pop","baroque pop","chamber pop","experimental pop"],p:"Pop"},
  {g:'sub',n:"Indie pop",i:'marcador',c:'#e87ba4',k:["indie pop","twee pop","jangle pop"],p:"Pop"},
  {g:'sub',n:"Dream pop",i:'nube',c:'#e87ba4',k:["dream pop","shoegaze","ethereal wave"],p:"Pop"},
  {g:'sub',n:"Power pop",i:'rayo',c:'#e87ba4',k:["power pop","powerpop"],p:"Pop"},
  {g:'sub',n:"Pop rock",i:'guitarra',c:'#e87ba4',k:["pop rock","pop-rock","soft rock","aor","yacht rock"],p:"Pop"},
  {g:'sub',n:"Hyperpop",i:'chispa',c:'#e87ba4',k:["hyperpop","glitchcore","digicore","bubblegum bass","pc music"],p:"Pop"},
  {g:'sub',n:"Pop latino",i:'copa',c:'#e87ba4',k:["latin pop","pop latino","colombian pop","spanish pop","flamenco pop","mexican pop"],p:"Pop"},
  {g:'sub',n:"Teen pop",i:'estrella',c:'#e87ba4',k:["teen pop","bubblegum pop","boy band","girl group"],p:"Pop"},
  {g:'sub',n:"Eurovisión",i:'microfono',c:'#e87ba4',k:["eurovision","operacion triunfo","melodifestivalen"],p:"Pop"},
  {g:'sub',n:"Soft pop",i:'nube',c:'#e87ba4',k:["soft pop","sophisti-pop","easy listening","adult contemporary"],p:"Pop"},
  {g:'sub',n:"Classic rock",i:'guitarra',c:'#e34948',k:["classic rock"],p:"Rock"},
  {g:'sub',n:"Hard rock",i:'guitarra',c:'#e34948',k:["hard rock","glam rock","glam metal","arena rock"],p:"Rock"},
  {g:'sub',n:"Psicodélico",i:'espiral',c:'#e34948',k:["psychedelic rock","psychedelic","acid rock","neo-psychedelic","krautrock"],p:"Rock"},
  {g:'sub',n:"Rock progresivo",i:'engranaje',c:'#e34948',k:["progressive rock","prog rock","art rock","canterbury scene","symphonic rock"],p:"Rock"},
  {g:'sub',n:"Grunge",i:'guitarra',c:'#e34948',k:["grunge","post-grunge"],p:"Rock"},
  {g:'sub',n:"Britpop",i:'bandera',c:'#e34948',k:["britpop","madchester","baggy"],p:"Rock"},
  {g:'sub',n:"Indie rock",i:'marcador',c:'#e34948',k:["indie rock","garage rock","post-punk revival"],p:"Rock"},
  {g:'sub',n:"Post-punk",i:'rayo',c:'#e34948',k:["post-punk","coldwave","cold wave","darkwave","gothic rock","goth","no wave"],p:"Rock"},
  {g:'sub',n:"Post-rock",i:'niebla',c:'#e34948',k:["post-rock","math rock","slowcore"],p:"Rock"},
  {g:'sub',n:"Noise rock",i:'rayo',c:'#e34948',k:["noise rock","industrial rock","industrial"],p:"Rock"},
  {g:'sub',n:"Surf rock",i:'onda',c:'#e34948',k:["surf rock","surf"],p:"Rock"},
  {g:'sub',n:"Southern rock",i:'casa',c:'#e34948',k:["southern rock","roots rock","heartland rock","swamp rock"],p:"Rock"},
  {g:'sub',n:"Folk rock",i:'hoja',c:'#e34948',k:["folk rock","country rock","celtic rock"],p:"Rock"},
  {g:'sub',n:"Rock en español",i:'bandera',c:'#e34948',k:["rock en espanol","spanish rock","argentine rock","rock catala","mexican rock","rock nacional","latin rock","latin alternative","latin indie","mestizo","patchanka","mestizaje","rock latino"],p:"Rock"},
  {g:'sub',n:"Proto-punk",i:'rayo',c:'#e34948',k:["proto-punk","protopunk"],p:"Rock"},
  {g:'sub',n:"Rockabilly",i:'guitarra',c:'#e34948',k:["rockabilly","rock and roll","rock n roll","doo-wop"],p:"Rock"},
  {g:'sub',n:"Heavy metal",i:'calavera',c:'#4c4a52',k:["heavy metal","nwobhm","speed metal","power metal"],p:"Metal"},
  {g:'sub',n:"Thrash metal",i:'calavera',c:'#4c4a52',k:["thrash metal","thrash","crossover thrash"],p:"Metal"},
  {g:'sub',n:"Death metal",i:'calavera',c:'#4c4a52',k:["death metal","old school death metal","swedish death metal","brutal death metal","technical death metal","melodic death metal","deathcore"],p:"Metal"},
  {g:'sub',n:"Black metal",i:'calavera',c:'#4c4a52',k:["black metal","blackgaze","atmospheric black metal"],p:"Metal"},
  {g:'sub',n:"Doom y sludge",i:'niebla',c:'#4c4a52',k:["doom metal","doom","sludge","stoner rock","stoner metal"],p:"Metal"},
  {g:'sub',n:"Metal alternativo",i:'marcador',c:'#4c4a52',k:["alternative metal","nu metal","metalcore","post-metal","djent","groove metal"],p:"Metal"},
  {g:'sub',n:"Punk rock",i:'rayo',c:'#d1394f',k:["punk rock","street punk","oi"],p:"Punk"},
  {g:'sub',n:"Hardcore punk",i:'rayo',c:'#d1394f',k:["hardcore punk","post-hardcore","powerviolence","crust punk","d-beat"],p:"Punk"},
  {g:'sub',n:"Pop punk",i:'rayo',c:'#d1394f',k:["pop punk","skate punk","emo pop","easycore"],p:"Punk"},
  {g:'sub',n:"Emo y screamo",i:'corazon',c:'#d1394f',k:["emo","screamo","midwest emo","emo revival"],p:"Punk"},
  {g:'sub',n:"Ska punk",i:'gota',c:'#d1394f',k:["ska punk","two tone","2 tone"],p:"Punk"},
  {g:'sub',n:"Classic soul",i:'corazon',c:'#2a78d6',k:["classic soul","southern soul","northern soul","memphis soul","philly soul","deep soul"],p:"R&B y soul"},
  {g:'sub',n:"Neo soul",i:'corazon',c:'#2a78d6',k:["neo soul","neo-soul","alternative rnb","alternative r&b","prog-rnb"],p:"R&B y soul"},
  {g:'sub',n:"R&B contemporáneo",i:'corazon',c:'#2a78d6',k:["contemporary r&b","urban contemporary","slow jams","quiet storm","latin r&b","french r&b"],p:"R&B y soul"},
  {g:'sub',n:"Doo-wop",i:'microfono',c:'#2a78d6',k:["doo-wop","doo wop","vocal group"],p:"R&B y soul"},
  {g:'sub',n:"Motown",i:'estrella',c:'#2a78d6',k:["motown"],p:"R&B y soul"},
  {g:'sub',n:"New jack swing",i:'espiral',c:'#2a78d6',k:["new jack swing","swingbeat"],p:"R&B y soul"},
  {g:'sub',n:"P-funk",i:'disco',c:'#d98c1f',k:["p-funk","funk rock","funk pop","funky"],p:"Funk y disco"},
  {g:'sub',n:"G-funk",i:'palmera',c:'#d98c1f',k:["g-funk","g funk"],p:"Funk y disco"},
  {g:'sub',n:"Boogie y disco",i:'disco',c:'#d98c1f',k:["boogie","disco","euro disco","space disco"],p:"Funk y disco"},
  {g:'sub',n:"Bebop",i:'nota',c:'#1baf7a',k:["bebop","hard bop","post-bop"],p:"Jazz"},
  {g:'sub',n:"Cool jazz",i:'copo',c:'#1baf7a',k:["cool jazz","modal jazz","west coast jazz"],p:"Jazz"},
  {g:'sub',n:"Free jazz",i:'espiral',c:'#1baf7a',k:["free jazz","avant-garde jazz","spiritual jazz"],p:"Jazz"},
  {g:'sub',n:"Jazz fusión",i:'engranaje',c:'#1baf7a',k:["jazz fusion","fusion","jazz-funk","jazz funk","acid jazz","nu jazz"],p:"Jazz"},
  {g:'sub',n:"Jazz vocal",i:'microfono',c:'#1baf7a',k:["vocal jazz","jazz vocal","adult standards","traditional pop","crooner","torch song"],p:"Jazz"},
  {g:'sub',n:"Big band y swing",i:'nota',c:'#1baf7a',k:["big band","swing","swing music","jump blues","dixieland"],p:"Jazz"},
  {g:'sub',n:"Bossa nova",i:'palmera',c:'#1baf7a',k:["bossa nova","samba jazz","latin jazz"],p:"Jazz"},
  {g:'sub',n:"Soul jazz",i:'nota',c:'#1baf7a',k:["soul jazz","organ jazz"],p:"Jazz"},
  {g:'sub',n:"Delta blues",i:'onda',c:'#3a5f8a',k:["delta blues","country blues","acoustic blues","classic blues"],p:"Blues"},
  {g:'sub',n:"Chicago blues",i:'onda',c:'#3a5f8a',k:["chicago blues","electric blues"],p:"Blues"},
  {g:'sub',n:"Blues rock",i:'guitarra',c:'#3a5f8a',k:["blues rock","soul blues","british blues"],p:"Blues"},
  {g:'sub',n:"Barroco",i:'libro',c:'#8a6a4a',k:["baroque","early music","renaissance"],p:"Clásica"},
  {g:'sub',n:"Ópera",i:'microfono',c:'#8a6a4a',k:["opera","operetta","zarzuela","bel canto","tenor","soprano","baritono","aria"],p:"Clásica"},
  {g:'sub',n:"Piano solo",i:'teclado',c:'#8a6a4a',k:["classical piano","solo piano","piano"],p:"Clásica"},
  {g:'sub',n:"Música de cámara",i:'nota',c:'#8a6a4a',k:["chamber music","string quartet","concerto","sonata"],p:"Clásica"},
  {g:'sub',n:"Minimalismo",i:'niebla',c:'#8a6a4a',k:["minimalism","post-minimalism","modern classical","contemporary classical","neoclassical"],p:"Clásica"},
  {g:'sub',n:"Classic country",i:'casa',c:'#a3690f',k:["classic country","outlaw country","honky tonk","nashville sound"],p:"Country y folk"},
  {g:'sub',n:"Bluegrass",i:'guitarra',c:'#a3690f',k:["bluegrass","old-time","appalachian"],p:"Country y folk"},
  {g:'sub',n:"Cantautor",i:'hoja',c:'#a3690f',k:["singer-songwriter","cantautor","chanson","trova","nueva trova","variete francaise","italian singer-songwriter"],p:"Country y folk"},
  {g:'sub',n:"Folk indie",i:'hoja',c:'#a3690f',k:["indie folk","freak folk","contemporary folk","folk pop"],p:"Country y folk"},
  {g:'sub',n:"Americana",i:'casa',c:'#a3690f',k:["americana","alt-country","cowpunk"],p:"Country y folk"},
  {g:'sub',n:"Roots reggae",i:'hoja',c:'#3f9c35',k:["roots reggae","roots","lovers rock","reggae en espanol"],p:"Reggae y dancehall"},
  {g:'sub',n:"Dub",i:'gota',c:'#3f9c35',k:["dub","dub poetry"],p:"Reggae y dancehall"},
  {g:'sub',n:"Dancehall",i:'altavoz',c:'#3f9c35',k:["dancehall","ragga","bashment"],p:"Reggae y dancehall"},
  {g:'sub',n:"Ska",i:'gota',c:'#3f9c35',k:["ska","rocksteady"],p:"Reggae y dancehall"},
  {g:'sub',n:"Salsa",i:'nota',c:'#eda100',k:["salsa","salsa dura","son cubano","guaracha","mambo","boogaloo"],p:"Latino"},
  {g:'sub',n:"Bachata",i:'guitarra',c:'#eda100',k:["bachata"],p:"Latino"},
  {g:'sub',n:"Cumbia",i:'onda',c:'#eda100',k:["cumbia","cumbia villera","vallenato"],p:"Latino"},
  {g:'sub',n:"Merengue",i:'copa',c:'#eda100',k:["merengue","merengue tipico"],p:"Latino"},
  {g:'sub',n:"Bolero",i:'corazon',c:'#eda100',k:["bolero","bolero son","trio romantico","boleros"],p:"Latino"},
  {g:'sub',n:"Tango",i:'flor',c:'#eda100',k:["tango","milonga","techengue"],p:"Latino"},
  {g:'sub',n:"Reggaetón clásico",i:'altavoz',c:'#e0563a',k:["old school reggaeton","reggaeton clasico","perreo"],p:"Reggaetón y urbano"},
  {g:'sub',n:"Neoperreo",i:'chispa',c:'#e0563a',k:["neoperreo","experimental reggaeton","perreo","malianteo","underground reggaeton"],p:"Reggaetón y urbano"},
  {g:'sub',n:"Dembow",i:'onda',c:'#e0563a',k:["dembow","dembow dominicano"],p:"Reggaetón y urbano"},
  {g:'sub',n:"Afrobeats",i:'sol',c:'#e0563a',k:["afrobeats","afro pop","afroswing","amapiano"],p:"Africano"},
  {g:'sub',n:"Corridos tumbados",i:'corona',c:'#b5761c',k:["corridos tumbados","sad sierreno","sierreno","corridos belicos","corrido"],p:"Regional mexicano"},
  {g:'sub',n:"Banda y norteño",i:'nota',c:'#b5761c',k:["banda","norteno","duranguense","mariachi","ranchera"],p:"Regional mexicano"},
  {g:'sub',n:"Flamenco puro",i:'abanico',c:'#b03f30',k:["flamenco","cante jondo","cante"],p:"Flamenco"},
  {g:'sub',n:"Flamenco nuevo",i:'chispa',c:'#b03f30',k:["flamenco nuevo","nuevo flamenco","flamenco urbano","flamenco fusion","flamenco pop"],p:"Flamenco"},
  {g:'sub',n:"Rumba",i:'guitarra',c:'#b03f30',k:["rumba","rumba catalana","rumba flamenca"],p:"Flamenco"},
  {g:'sub',n:"Copla",i:'abanico',c:'#b03f30',k:["copla","cancion espanola","tonadilla"],p:"Flamenco"},
  {g:'sub',n:"Synthwave",i:'sol',c:'#a05cc0',k:["synthwave","retrowave","outrun","vaporwave"],p:"Electropop y synth"},
  {g:'sub',n:"New wave",i:'chispa',c:'#a05cc0',k:["new wave","neue deutsche welle","new romantic","minimal wave"],p:"Electropop y synth"},
  {g:'sub',n:"Synthpop",i:'teclado',c:'#a05cc0',k:["synthpop","synth pop","electropop","futurepop"],p:"Electropop y synth"},
  {g:'sub',n:"Italo disco",i:'disco',c:'#a05cc0',k:["italo disco","hi-nrg","italo dance"],p:"Electropop y synth"},
  {g:'sub',n:"Electroclash",i:'chispa',c:'#a05cc0',k:["electroclash","new rave","bloghouse","blog house","dance-punk","alternative dance"],p:"Electropop y synth"},
  {g:'sub',n:"Chiptune",i:'mando',c:'#a05cc0',k:["chiptune","8-bit","bitpop","video game"],p:"Electropop y synth"},
  {g:'sub',n:"Indietronica",i:'marcador',c:'#a05cc0',k:["indietronica","folktronica","electronic rock"],p:"Electropop y synth"},
  {g:'sub',n:"Ambient",i:'niebla',c:'#6b7b8c',k:["ambient","drone","dark ambient","space ambient"],p:"Ambient y experimental"},
  {g:'sub',n:"IDM",i:'glitch',c:'#6b7b8c',k:["idm","braindance","glitch","wonky","ninja tune"],p:"Ambient y experimental"},
  {g:'sub',n:"Trip hop",i:'niebla',c:'#6b7b8c',k:["trip hop","trip-hop","downtempo"],p:"Ambient y experimental"},
  {g:'sub',n:"Lo-fi",i:'auriculares',c:'#6b7b8c',k:["lo-fi","lofi","bedroom pop","bedroom"],p:"Ambient y experimental"},
  {g:'sub',n:"Musique concrète",i:'espiral',c:'#6b7b8c',k:["musique concrete","tape music","field recording","noise","power electronics"],p:"Ambient y experimental"},
  {g:'sub',n:"Plunderphonics",i:'glitch',c:'#6b7b8c',k:["plunderphonics","mashup","sampledelia","bootleg"],p:"Ambient y experimental"},
  {g:'sub',n:"New age",i:'flor',c:'#6b7b8c',k:["new age","healing","meditation"],p:"Ambient y experimental"},
  {g:'sub',n:"Big beat",i:'martillo',c:'#7a5cd6',k:["big beat","bigbeat"],p:"Electrónica"},
  {g:'sub',n:"Nu disco",i:'disco',c:'#7a5cd6',k:["nu disco","nu-disco","disco funk","future funk"],p:"Electrónica"},
  {g:'sub',n:"Hi-NRG y eurobeat",i:'rayo',c:'#7a5cd6',k:["hi-nrg","hi nrg","hinrg","eurobeat","italo dance","hands up","handsup"],p:"Electrónica"},
  {g:'sub',n:"Jumpstyle y hardbass",i:'pesas',c:'#7a5cd6',k:["jumpstyle","hardbass","hard bass","tekstyle","gopnik"],p:"Electrónica"},
  {g:'sub',n:"Hypertechno",i:'chispa',c:'#7a5cd6',k:["hypertechno","hyper techno"],p:"Electrónica"},
  {g:'sub',n:"Techengue",i:'copa',c:'#7a5cd6',k:["techengue","cumbiaton","cumbia 420"],p:"Electrónica"},
  {g:'sub',n:"Tekno y free party",i:'altavoz',c:'#7a5cd6',k:["tekno","free tekno","freetekno","tribe","hardtek","mentalcore"],p:"Electrónica"},
  {g:'sub',n:"Chillwave y vaporwave",i:'palmera',c:'#7a5cd6',k:["chillwave","vaporwave","future funk","glo-fi"],p:"Electrónica"},
  {g:'sub',n:"Downtempo",i:'nube',c:'#7a5cd6',k:["downtempo","chillout","chill out","chill-out","electronic-lounge"],p:"Electrónica"},
  {g:'sub',n:"Nightcore",i:'chispa',c:'#7a5cd6',k:["nightcore","sped up","speed up","spedup"],p:"Electrónica"},
  {g:'sub',n:"Ghettotech y juke",i:'glitch',c:'#7a5cd6',k:["ghettotech","ghetto house","juke","footwork","ghetto tech"],p:"Electrónica"},
  {g:'sub',n:"Baltimore club",i:'onda',c:'#7a5cd6',k:["baltimore club","baltimore breaks","bmore"],p:"Electrónica"},
  {g:'sub',n:"UK funky",i:'disco',c:'#7a5cd6',k:["uk funky","funky house"],p:"Electrónica"},
  {g:'sub',n:"Bassline y speed garage",i:'onda',c:'#7a5cd6',k:["bassline","speed garage","4x4 garage","niche"],p:"Electrónica"},
  {g:'sub',n:"Future garage",i:'niebla',c:'#7a5cd6',k:["future garage"],p:"Electrónica"},
  {g:'sub',n:"Electro swing",i:'teclado',c:'#7a5cd6',k:["electro swing","electroswing","swing house"],p:"Electrónica"},
  {g:'sub',n:"Afro tech",i:'sol',c:'#7a5cd6',k:["afro tech","afrotech","afro techno"],p:"Electrónica"},
  {g:'sub',n:"G-house",i:'ciudad',c:'#5b8cf0',k:["g-house","g house","ghouse","gangsta house"],p:"House"},
  {g:'sub',n:"Tribal house",i:'martillo',c:'#5b8cf0',k:["tribal house","tribal","tribal tech"],p:"House"},
  {g:'sub',n:"Dutch house",i:'bandera',c:'#5b8cf0',k:["dutch house","dirty dutch","fidget house","stutter house"],p:"House"},
  {g:'sub',n:"Brazilian bass",i:'palmera',c:'#5b8cf0',k:["brazilian bass","speed house","bass brasileiro"],p:"House"},
  {g:'sub',n:"Peak time techno",i:'montana',c:'#4a5568',k:["peak time","peak-time","driving techno"],p:"Techno"},
  {g:'sub',n:"Melodic bass",i:'corazon',c:'#2b9c8a',k:["melodic bass","future riddim","colour bass","color bass","kawaii bass"],p:"Dubstep y bass"},
  {g:'sub',n:"Brostep y tearout",i:'calavera',c:'#2b9c8a',k:["brostep","tearout","tear out","filthstep","gorestep","filth"],p:"Dubstep y bass"},
  {g:'sub',n:"Lovestep",i:'corazon',c:'#2b9c8a',k:["lovestep"],p:"Dubstep y bass"},
  {g:'sub',n:"Techstep y darkstep",i:'calavera',c:'#c0533f',k:["techstep","darkstep","neurostep"],p:"Drum and bass"},
  {g:'sub',n:"Hardcore techno",i:'martillo',c:'#b8202e',k:["hardcore techno","hardtekk","makina","bakalao","mákina"],p:"Hardstyle y hardcore"},
  {g:'sub',n:"Old school",i:'reloj',c:'#eb6834',k:["old school hip hop","old school rap","golden age hip hop","old school hip-hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Underground hip-hop",i:'niebla',c:'#eb6834',k:["underground hip hop","underground hip-hop","underground rap","indie rap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Experimental hip-hop",i:'glitch',c:'#eb6834',k:["experimental hip hop","experimental hip-hop","abstract hip hop","art rap","avant-garde hip hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Cloud rap",i:'nube',c:'#eb6834',k:["cloud rap","cloudrap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Emo rap",i:'gota',c:'#eb6834',k:["emo rap","sad rap","sadboys","sadboy"],p:"Rap y hip-hop"},
  {g:'sub',n:"Crunk",i:'altavoz',c:'#eb6834',k:["crunk","crunkcore","snap music"],p:"Rap y hip-hop"},
  {g:'sub',n:"Hardcore hip-hop",i:'martillo',c:'#eb6834',k:["hardcore hip hop","hardcore rap","hardcore hip-hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Jazz rap",i:'nota',c:'#eb6834',k:["jazz rap","jazzy hip hop","jazz hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Turntablism",i:'disco',c:'#eb6834',k:["turntablism","scratch","turntable","dj battle","scratching"],p:"Rap y hip-hop"},
  {g:'sub',n:"Miami bass",i:'palmera',c:'#eb6834',k:["miami bass","booty bass","booty music"],p:"Rap y hip-hop"},
  {g:'sub',n:"Country rap",i:'casa',c:'#eb6834',k:["country rap","hick hop","hick-hop"],p:"Rap y hip-hop"},
  {g:'sub',n:"Hyphy y jerk",i:'coche',c:'#eb6834',k:["hyphy","jerk","jerkin","bay area rap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Mumble rap",i:'niebla',c:'#eb6834',k:["mumble rap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Nederhop",i:'bandera',c:'#eb6834',k:["nederhop","dutch hip hop","nederrap"],p:"Rap y hip-hop"},
  {g:'sub',n:"Drift phonk",i:'coche',c:'#8a4a2e',k:["drift phonk","driftphonk","house phonk"],p:"Trap"},
  {g:'sub',n:"Brazilian phonk",i:'palmera',c:'#8a4a2e',k:["brazilian phonk","funk phonk","phonk brasileiro","krushfunk"],p:"Trap"},
  {g:'sub',n:"Trap argentino",i:'bandera',c:'#8a4a2e',k:["argentine trap","trap argentino","trap arg"],p:"Trap"},
  {g:'sub',n:"Trap metal",i:'calavera',c:'#8a4a2e',k:["trap metal","rage","opium","scream rap"],p:"Trap"},
  {g:'sub',n:"Baroque pop",i:'libro',c:'#e87ba4',k:["baroque pop","chamber pop","orchestral pop"],p:"Pop"},
  {g:'sub',n:"Bedroom pop",i:'luna',c:'#e87ba4',k:["bedroom pop","bedroom"],p:"Pop"},
  {g:'sub',n:"Europop",i:'estrella',c:'#e87ba4',k:["europop","euro pop","euro-pop"],p:"Pop"},
  {g:'sub',n:"Bubblegum y boy bands",i:'chispa',c:'#e87ba4',k:["bubblegum","boy band","boyband","boybands","girl group","bubblegum pop"],p:"Pop"},
  {g:'sub',n:"Standards y crooner",i:'copa',c:'#e87ba4',k:["adult standards","traditional pop","crooner","vocal pop","easy listening","swing pop"],p:"Pop"},
  {g:'sub',n:"K-pop",i:'flor',c:'#e87ba4',k:["k-pop","kpop","korean pop","k-hip hop"],p:"Pop"},
  {g:'sub',n:"J-pop y city pop",i:'flor',c:'#e87ba4',k:["j-pop","jpop","japanese pop","city pop","citypop","shibuya-kei"],p:"Pop"},
  {g:'sub',n:"Schlager",i:'copa',c:'#e87ba4',k:["schlager","volksmusik","deutschpop"],p:"Pop"},
  {g:'sub',n:"Chanson y yé-yé",i:'flor',c:'#e87ba4',k:["chanson","variete francaise","ye-ye","yeye","ye ye","french pop"],p:"Pop"},
  {g:'sub',n:"Balada romántica",i:'corazon',c:'#e87ba4',k:["balada","baladas","balada romantica","romantica","musica romantica","bolero pop"],p:"Pop"},
  {g:'sub',n:"Soft rock",i:'nube',c:'#e34948',k:["soft rock","adult contemporary","mellow rock"],p:"Rock"},
  {g:'sub',n:"Yacht rock",i:'avion',c:'#e34948',k:["yacht rock","smooth rock","west coast sound"],p:"Rock"},
  {g:'sub',n:"Glam rock",i:'estrella',c:'#e34948',k:["glam rock","glam","glitter rock"],p:"Rock"},
  {g:'sub',n:"Art rock",i:'flor',c:'#e34948',k:["art rock","experimental rock","avant-rock"],p:"Rock"},
  {g:'sub',n:"Krautrock",i:'engranaje',c:'#e34948',k:["krautrock","kosmische","kosmische musik","zeuhl"],p:"Rock"},
  {g:'sub',n:"Garage rock",i:'coche',c:'#e34948',k:["garage rock","garage punk","freakbeat"],p:"Rock"},
  {g:'sub',n:"Shoegaze",i:'niebla',c:'#e34948',k:["shoegaze","shoegazing","nu gaze"],p:"Rock"},
  {g:'sub',n:"Math rock",i:'engranaje',c:'#e34948',k:["math rock","midwest emo","post-math"],p:"Rock"},
  {g:'sub',n:"Roots rock",i:'casa',c:'#e34948',k:["roots rock","heartland rock","pub rock"],p:"Rock"},
  {g:'sub',n:"Acid rock",i:'espiral',c:'#e34948',k:["acid rock","space rock","freak folk"],p:"Rock"},
  {g:'sub',n:"Stoner rock",i:'nube',c:'#e34948',k:["stoner rock","desert rock","stoner","stoner metal"],p:"Rock"},
  {g:'sub',n:"Nu metal",i:'calavera',c:'#4c4a52',k:["nu metal","nu-metal","numetal"],p:"Metal"},
  {g:'sub',n:"Rap metal",i:'microfono',c:'#4c4a52',k:["rap metal","rapcore","funk metal","rap rock"],p:"Metal"},
  {g:'sub',n:"Glam metal",i:'estrella',c:'#4c4a52',k:["glam metal","hair metal","sleaze rock","sleaze metal"],p:"Metal"},
  {g:'sub',n:"Power y sinfónico",i:'corona',c:'#4c4a52',k:["power metal","symphonic metal","epic metal"],p:"Metal"},
  {g:'sub',n:"Metalcore",i:'martillo',c:'#4c4a52',k:["metalcore","deathcore","post-hardcore","mathcore"],p:"Metal"},
  {g:'sub',n:"Death metal clásico",i:'calavera',c:'#4c4a52',k:["old school death metal","swedish death metal","melodic death metal","brutal death metal"],p:"Metal"},
  {g:'sub',n:"Groove e industrial",i:'engranaje',c:'#4c4a52',k:["groove metal","industrial metal","nu-industrial"],p:"Metal"},
  {g:'sub',n:"Metal progresivo",i:'espiral',c:'#4c4a52',k:["progressive metal","djent","technical death metal","avant-garde metal"],p:"Metal"},
  {g:'sub',n:"Psychobilly",i:'calavera',c:'#d1394f',k:["psychobilly","horror punk","deathrock"],p:"Punk"},
  {g:'sub',n:"Riot grrrl y queercore",i:'flor',c:'#d1394f',k:["riot grrrl","queercore","riot grrl"],p:"Punk"},
  {g:'sub',n:"Indie latino",i:'palmera',c:'#3f9c35',k:["latin indie","indie latino","latin alternative","rock alternativo","indie espanol"],p:"Indie y alternativo"},
  {g:'sub',n:"Alternative dance",i:'rayo',c:'#3f9c35',k:["alternative dance","new rave","dance-punk","indie dance","dance punk","madchester"],p:"Indie y alternativo"},
  {g:'sub',n:"Twee y jangle",i:'flor',c:'#3f9c35',k:["twee pop","jangle pop","twee","c86"],p:"Indie y alternativo"},
  {g:'sub',n:"Quiet storm",i:'luna',c:'#2a78d6',k:["quiet storm"],p:"R&B y soul"},
  {g:'sub',n:"Slow jams",i:'corazon',c:'#2a78d6',k:["slow jam","slow jams","baby making music"],p:"R&B y soul"},
  {g:'sub',n:"Northern soul",i:'disco',c:'#2a78d6',k:["northern soul","deep soul"],p:"R&B y soul"},
  {g:'sub',n:"Soul blues",i:'gota',c:'#2a78d6',k:["soul blues","southern soul","memphis soul"],p:"R&B y soul"},
  {g:'sub',n:"R&B alternativo",i:'niebla',c:'#2a78d6',k:["alternative rnb","alternative r&b","prog-rnb","pbr&b","indie soul","alt r&b","uk r&b"],p:"R&B y soul"},
  {g:'sub',n:"Rhythm and blues",i:'nota',c:'#2a78d6',k:["rhythm and blues","rhythm & blues","jump blues"],p:"R&B y soul"},
  {g:'sub',n:"Funk carioca",i:'palmera',c:'#d98c1f',k:["funk carioca","brazilian funk","baile funk","funk brasileiro","funk mandelao","funk paulista","passo bem solto"],p:"Funk y disco"},
  {g:'sub',n:"Jazz funk",i:'nota',c:'#d98c1f',k:["jazz funk","jazz-funk","acid jazz"],p:"Funk y disco"},
  {g:'sub',n:"Latin jazz",i:'copa',c:'#1baf7a',k:["latin jazz","afro-cuban jazz","jazz latino"],p:"Jazz"},
  {g:'sub',n:"Smooth jazz",i:'nube',c:'#1baf7a',k:["smooth jazz","jazz pop","elevator jazz"],p:"Jazz"},
  {g:'sub',n:"Hard bop",i:'nota',c:'#1baf7a',k:["hard bop","post-bop","modal jazz"],p:"Jazz"},
  {g:'sub',n:"Ragtime y stride",i:'teclado',c:'#1baf7a',k:["ragtime","stride","dixieland","new orleans jazz"],p:"Jazz"},
  {g:'sub',n:"Nu jazz",i:'chispa',c:'#1baf7a',k:["nu jazz","jazztronica","future jazz"],p:"Jazz"},
  {g:'sub',n:"Classic blues",i:'reloj',c:'#3a5f8a',k:["classic blues","country blues","acoustic blues","piedmont blues"],p:"Blues"},
  {g:'sub',n:"Orquestal",i:'libro',c:'#8a6a4a',k:["orchestral","orchestra","symphony","symphonic","sinfonia","sinfonico"],p:"Clásica"},
  {g:'sub',n:"Concierto",i:'nota',c:'#8a6a4a',k:["concerto","concierto","concerto grosso"],p:"Clásica"},
  {g:'sub',n:"Coral",i:'corona',c:'#8a6a4a',k:["choral","chorus","coro","requiem","cantata","gregorian","canto gregoriano"],p:"Clásica"},
  {g:'sub',n:"Música antigua",i:'libro',c:'#8a6a4a',k:["early music","renaissance","medieval","musica antigua"],p:"Clásica"},
  {g:'sub',n:"Romanticismo",i:'corazon',c:'#8a6a4a',k:["romanticism","romantic era","impressionism","impressionist","impresionismo"],p:"Clásica"},
  {g:'sub',n:"Clásica contemporánea",i:'chispa',c:'#8a6a4a',k:["contemporary classical","avant-garde classical","electronic classical","neoclassical","neoclasica"],p:"Clásica"},
  {g:'sub',n:"Outlaw country",i:'coche',c:'#a3690f',k:["outlaw country","honky tonk","western","western swing"],p:"Country y folk"},
  {g:'sub',n:"Country pop",i:'estrella',c:'#a3690f',k:["country pop","country rock","nashville sound","contemporary country"],p:"Country y folk"},
  {g:'sub',n:"Folk celta",i:'hoja',c:'#a3690f',k:["celtic","celtic folk","irish folk","folk irlandes","celtic punk"],p:"Country y folk"},
  {g:'sub',n:"Folclore latinoamericano",i:'montana',c:'#a3690f',k:["nueva cancion","folclore","folklore","andean","andina","musica andina","peruvian folk","folclore argentino"],p:"Country y folk"},
  {g:'sub',n:"Rocksteady",i:'sol',c:'#3f9c35',k:["rocksteady","early reggae","ska jazz"],p:"Reggae y dancehall"},
  {g:'sub',n:"Ragga",i:'altavoz',c:'#3f9c35',k:["ragga","raggamuffin","bashment","ragga jungle"],p:"Reggae y dancehall"},
  {g:'sub',n:"Son cubano",i:'palmera',c:'#eda100',k:["son cubano","son montuno","guaracha","trova cubana","buena vista social club","timba"],p:"Latino"},
  {g:'sub',n:"Trova",i:'guitarra',c:'#eda100',k:["trova","nueva trova","cantautor latino","trovador"],p:"Latino"},
  {g:'sub',n:"Cha-cha-chá y mambo",i:'copa',c:'#eda100',k:["cha cha cha","chachacha","cha-cha-cha","mambo","danzon"],p:"Latino"},
  {g:'sub',n:"Candombe y murga",i:'martillo',c:'#eda100',k:["candombe","murga","milonga"],p:"Latino"},
  {g:'sub',n:"Vallenato y champeta",i:'sol',c:'#eda100',k:["vallenato","champeta","cumbia villera","porro"],p:"Latino"},
  {g:'sub',n:"Electrocumbia",i:'rayo',c:'#eda100',k:["electrocumbia","cumbia electronica","digital cumbia","nu cumbia"],p:"Latino"},
  {g:'sub',n:"RKT y turreo",i:'fuego',c:'#e0563a',k:["rkt","turreo","cumbia 420","turreo argentino"],p:"Reggaetón y urbano"},
  {g:'sub',n:"Reggaetón chileno",i:'bandera',c:'#e0563a',k:["reggaeton chileno","trap chileno","perreo chileno"],p:"Reggaetón y urbano"},
  {g:'sub',n:"Mariachi",i:'corona',c:'#b5761c',k:["mariachi","son jalisciense","mariachi moderno"],p:"Regional mexicano"},
  {g:'sub',n:"Ranchera",i:'copa',c:'#b5761c',k:["ranchera","rancheras","ranchero"],p:"Regional mexicano"},
  {g:'sub',n:"Corrido",i:'guitarra',c:'#b5761c',k:["corrido","corridos","corridos belicos","narcocorrido"],p:"Regional mexicano"},
  {g:'sub',n:"Tejano",i:'bandera',c:'#b5761c',k:["tejano","tex-mex","conjunto"],p:"Regional mexicano"},
  {g:'sub',n:"Flamenco pop",i:'abanico',c:'#b03f30',k:["flamenco pop","pop flamenco","pop andaluz"],p:"Flamenco"},
  {g:'sub',n:"Flamenco urbano",i:'ciudad',c:'#b03f30',k:["flamenco urbano","flamenco trap","nuevo flamenco urbano"],p:"Flamenco"},
  {g:'sub',n:"Rumba catalana",i:'guitarra',c:'#b03f30',k:["rumba catalana","rumbapop","tecnorumba","rumba flamenca","catalan rumba"],p:"Flamenco"},
  {g:'sub',n:"Electropop",i:'teclado',c:'#a05cc0',k:["electropop","electro pop","synth pop moderno"],p:"Electropop y synth"},
  {g:'sub',n:"Darkwave",i:'luna',c:'#a05cc0',k:["darkwave","coldwave","minimal wave","ethereal wave"],p:"Electropop y synth"},
  {g:'sub',n:"EBM e industrial",i:'engranaje',c:'#a05cc0',k:["ebm","electronic body music","aggrotech","futurepop"],p:"Electropop y synth"},
  {g:'sub',n:"Glitch",i:'glitch',c:'#6b7b8c',k:["glitch","glitchtronica","clicks and cuts"],p:"Ambient y experimental"},
  {g:'sub',n:"Drone y dark ambient",i:'niebla',c:'#6b7b8c',k:["drone","dark ambient","field recording","ambient drone"],p:"Ambient y experimental"},
  {g:'sub',n:"Noise",i:'altavoz',c:'#6b7b8c',k:["noise","harsh noise","power electronics","noise music"],p:"Ambient y experimental"},
  {g:'sub',n:"Disney",i:'estrella',c:'#726858',k:["disney","pixar","musical de disney"],p:"Bandas sonoras"},
  {g:'sub',n:"Anime",i:'flor',c:'#726858',k:["anime","anime ost","j-anime","anisong"],p:"Bandas sonoras"},
  {g:'sub',n:"Videojuegos",i:'mando',c:'#726858',k:["video game","videogame","game soundtrack","vgm","videojuego","gta","initial d","osu"],p:"Bandas sonoras"},
  {g:'sub',n:"Villancicos",i:'arbol',c:'#2f8f4e',k:["villancicos","christmas carol","christmas song","navidad","villancico"],p:"Navidad"},
  {g:'sub',n:"Afrobeat clásico",i:'sol',c:'#c98a1f',k:["afrobeat","fela","afro-funk"],p:"Africano"},
  {g:'sub',n:"Kuduro y kizomba",i:'sol',c:'#c98a1f',k:["kuduro","kizomba","semba","tarraxinha"],p:"Africano"},
  {g:'sub',n:"Samba y pagode",i:'palmera',c:'#2f9e5e',k:["samba","pagode","samba-rock","samba de roda"],p:"Brasileño"},
  {g:'sub',n:"MPB y tropicália",i:'flor',c:'#2f9e5e',k:["mpb","musica popular brasileira","tropicalia","tropicalismo"],p:"Brasileño"},

  /* ---------- AMBIENTE (56) ---------- */
  {g:'ambiente',n:"Para reventar",i:'fuego',c:'#e0402e',k:["big room","festival","hardstyle","hardcore","riddim","deathstep","brostep","gabber","frenchcore","speedcore","rawstyle","tearout","uptempo","hard techno","hard dance","crunk","trap metal","thrash","death metal","grindcore"]},
  {g:'ambiente',n:"Fiesta",i:'copa',c:'#e8a020',k:["party","dance","club","disco","eurodance","moombahton","jersey club","baltimore club","funk carioca","dembow","perreo","reggaeton","bounce","europop","hi-nrg","italo dance","jackin"]},
  {g:'ambiente',n:"Tranquilo",i:'luna',c:'#5b7fa0',k:["chill","chillout","chillstep","ambient","downtempo","lo-fi","lofi","acoustic","soft","easy listening","new age","slowcore","quiet storm","bossa nova","chillhop","sleep","meditation","soft rock","soft pop","bedroom pop"]},
  {g:'ambiente',n:"Melancólico",i:'gota',c:'#6a7f94',k:["sad","melancholy","melancholic","emo","shoegaze","slowcore","sadcore","blues","bolero","emo rap","sad rap","sad sierreno","depressive","ballad","elegy","doom"]},
  {g:'ambiente',n:"Romántico",i:'corazon',c:'#d4568a',k:["romantic","love","slow jams","quiet storm","bachata","bolero","lovers rock","soul ballad","bailar pegados","trio romantico","sexy"]},
  {g:'ambiente',n:"Oscuro",i:'calavera',c:'#3f3a45',k:["dark","darkwave","gothic","goth","horrorcore","black metal","doom","industrial","dark ambient","witch house","cold wave","coldwave","occult","noir"]},
  {g:'ambiente',n:"Épico",i:'montana',c:'#8a6a3f',k:["epic","orchestral","symphonic","cinematic","score","soundtrack","trailer","anthem","uplifting","power metal","progressive rock","concerto"]},
  {g:'ambiente',n:"Alegre",i:'sol',c:'#e5b520',k:["happy","upbeat","feel good","sunshine","tropical","summer","twee","bubblegum","doo-wop","ska","soca","happy hardcore","disney","villancicos","christmas"]},
  {g:'ambiente',n:"Para concentrarse",i:'sol',c:'#7b8ca0',k:["instrumental","ambient","minimal","classical piano","solo piano","study","focus","post-rock","drone","modern classical","neoclassical","chamber music","baroque"]},
  {g:'ambiente',n:"Para el gimnasio",i:'pesas',c:'#c4552f',k:["workout","gym","pump","big room","hardstyle","phonk","drift phonk","drill","gangsta rap","hardcore hip hop","rage rap","bass house","hard techno","riddim","brostep"]},
  {g:'ambiente',n:"Para conducir",i:'coche',c:'#4a7fa0',k:["driving","road","synthwave","retrowave","outrun","yacht rock","classic rock","aor","rally house","krautrock","motorik"]},
  {g:'ambiente',n:"Nostálgico",i:'reloj',c:'#9a7f5f',k:["oldies","nostalgia","retro","classic rock","motown","doo-wop","adult standards","traditional pop","vintage","yacht rock","city pop","copla","vaporwave"]},
  {g:'ambiente',n:"Raro y experimental",i:'espiral',c:'#7a5cd6',k:["experimental","avant-garde","outsider","noise","free jazz","musique concrete","glitch","breakcore","hyperpop","deconstructed club","abstract","weirdcore"]},
  {g:'ambiente',n:"Viaje psicodélico",i:'nube',c:'#9c5cc0',k:["psychedelic","psytrance","acid","neo-psychedelic","krautrock","space rock","trippy","dub","stoner"]},
  {g:'ambiente',n:"Agresivo",i:'rayo',c:'#b8202e',k:["aggressive","angry","rage","hardcore punk","powerviolence","grindcore","screamo","thrash","drill","horrorcore","crust punk","d-beat","noise rock"]},
  {g:'ambiente',n:"Callejero",i:'ciudad',c:'#5a6472',k:["street","gangsta rap","gangster rap","drill","grime","trap","boom bap","dirty south","hardcore hip hop","underground hip hop","mafioso rap","g-funk"]},
  {g:'ambiente',n:"De verano",i:'palmera',c:'#2fa08a',k:["tropical","summer","beach","surf","reggae","soca","tropical house","afrobeats","bossa nova","samba","cumbia","merengue","balearic"]},
  {g:'ambiente',n:"De madrugada",i:'estrella',c:'#4a4a7a',k:["late night","after hours","deep house","minimal techno","dub techno","downtempo","trip hop","ambient","drone","jazz vocal","torch song","slow jams"]},
  {g:'ambiente',n:"Bailar pegados",i:'flor',c:'#c05c8a',k:["bailar pegados","slow jams","bachata","bolero","lovers rock","quiet storm","soul ballad","doo-wop","romantic"]},
  {g:'ambiente',n:"Coro y voz",i:'microfono',c:'#a0785c',k:["a cappella","choir","vocal","female vocalists","male vocalists","female vocalist","vocal jazz","jazz vocal","vocal group","vocal trance","gospel","opera"]},
  {g:'ambiente',n:"Instrumental",i:'auriculares',c:'#7f8fa0',k:["instrumental","instrumental hip hop","instrumental hip-hop","post-rock","score","solo piano","classical piano","guitar","jazz fusion","math rock"]},
  {g:'ambiente',n:"Guilty pleasure",i:'ojo',c:'#d4708a',k:["guilty pleasure","eurovision","europop","teen pop","bubblegum pop","boy band","girl group","italo dance","eurodance","disney","novelty"]},
  {g:'ambiente',n:"Clásico eterno",i:'corona',c:'#c9a227',k:["classic rock","oldies","classic soul","motown","adult standards","traditional pop","doo-wop","classic blues","golden age hip hop","old school hip hop","standards"]},
  {g:'ambiente',n:"Underground",i:'niebla',c:'#6a6a72',k:["underground","underground hip hop","underground hip-hop","experimental","outsider","no wave","lo-fi","anarcho","crust punk","free jazz","harsh noise","abstract"]},
  {g:'ambiente',n:"Sensual",i:'corazon',c:'#c0407a',k:["sexy","sensual","slow jam","slow jams","quiet storm","baby making music","seductive"]},
  {g:'ambiente',n:"Festivalero",i:'chispa',c:'#e59020',k:["festival","mainstage","main stage","tomorrowland","rave","anthem","stadium"]},
  {g:'ambiente',n:"Para llorar",i:'gota',c:'#5a7f9c',k:["sad","sad songs","triste","heartbreak","breakup","crying","tearjerker"]},
  {g:'ambiente',n:"Motivación",i:'montana',c:'#2f9e7e',k:["motivational","uplifting","feel good","feelgood","inspirational","upbeat"]},
  {g:'ambiente',n:"Liminal",i:'niebla',c:'#7f8fa0',k:["vaporwave","dark ambient","drone","plunderphonics","dungeon synth","liminal","backrooms","weirdcore","dreamcore","chillwave"],L:'LIMINAL'},
  {g:'ambiente',n:"Ingrávido",i:'nube',c:'#7aa8d0',k:["shoegaze","dream pop","ambient pop","ethereal wave","uplifting trance","post-rock","new age","chillstep","melodic dubstep","future garage"]},
  {g:'ambiente',n:"La previa",i:'copa',c:'#e5701f',k:["eurodance","dance pop","electro house","big room","moombahton","hip house","tribal house","bounce","melbourne bounce","italo dance","hands up","party"]},
  {g:'ambiente',n:"Para gritar",i:'microfono',c:'#d4402e',k:["pop punk","emo","post-hardcore","punk rock","power ballad","glam metal","arena rock","stadium rock","britpop","hard rock","nu metal","rap metal","anthem"]},
  {g:'ambiente',n:"Rabia",i:'fuego',c:'#a01f1f',k:["hardcore punk","thrash metal","death metal","grindcore","metalcore","nu metal","industrial metal","drill","horrorcore","hardcore techno","speedcore","uptempo","powerviolence","black metal"]},
  {g:'ambiente',n:"Insufrible",i:'calavera',c:'#6a6a72',k:["worst","terrible","awful","cringe","mediocre","bad music","horrible","trash","so bad it is good"]},
  {g:'ambiente',n:"Risa",i:'chispa',c:'#e5b520',k:["comedy","parody","novelty","humor","humour","funny","comedia","parodia","nerdcore"],L:'MEMES'},
  {g:'ambiente',n:"Meme",i:'glitch',c:'#c05cc0',k:["meme","memes","viral","tiktok","earrape","shitpost","nightcore"],L:'MEMES'},
  {g:'ambiente',n:"Para correr",i:'pesas',c:'#2f9e7e',k:["drum and bass","liquid dnb","neurofunk","jungle","big room","hard techno","uplifting trance","happy hardcore","frenchcore","eurodance","breakbeat","running","jogging","cardio"]},
  {g:'ambiente',n:"Para dormir",i:'luna',c:'#5a6b8c',k:["ambient","new age","drone","piano solo","minimalism","lullaby","dark ambient","chillout","downtempo","slowcore"]},
  {g:'ambiente',n:"Siniestro",i:'calavera',c:'#4a3f52',k:["dark ambient","horrorcore","witch house","black metal","darkwave","gothic rock","deathrock","horror punk","doom","sludge","breakcore","industrial"]},
  {g:'ambiente',n:"Hipnótico",i:'espiral',c:'#7a5cd6',k:["minimal techno","krautrock","dub techno","psytrance","drone","acid house","minimalism","tribal house","deep house","hypnotic"]},
  {g:'ambiente',n:"Solitario",i:'luna',c:'#5f7f9c',k:["slowcore","sadcore","singer-songwriter","bedroom pop","folk indie","dream pop","cantautor","emo"]},
  {g:'ambiente',n:"Nihilista",i:'calavera',c:'#3f3f45',k:["depressive black metal","doom","sludge","slowcore","sadcore","post-punk","darkwave","black metal","nihilistic"]},
  {g:'ambiente',n:"Catártico",i:'montana',c:'#c0553f',k:["post-rock","shoegaze","screamo","emo","gospel","power ballad","doom","symphonic metal","opera","orchestral"]},
  {g:'ambiente',n:"Triunfal",i:'corona',c:'#c9a227',k:["power metal","symphonic metal","uplifting trance","big room","gospel","orchestral","marching band","epic"]},
  {g:'ambiente',n:"Tenso",i:'rayo',c:'#7a6a52',k:["industrial","dark ambient","industrial techno","noise","breakcore","horrorcore","drill","darkwave","post-punk","no wave","musique concrete"]},
  {g:'ambiente',n:"Íntimo",i:'corazon',c:'#9c7f8a',k:["singer-songwriter","acoustic","bedroom pop","folk indie","slowcore","cantautor","unplugged","piano solo","soft pop"]},
  {g:'ambiente',n:"Sucio y crudo",i:'martillo',c:'#7a5f3f',k:["garage rock","garage punk","noise rock","proto-punk","no wave","punk rock","blues rock","stoner rock","psychobilly"]},
  {g:'ambiente',n:"Elegante",i:'copa',c:'#3f5f7a',k:["cool jazz","bossa nova","lounge","easy listening","vocal jazz","smooth jazz","soul jazz","sophisti-pop","yacht rock","chamber pop","adult standards"]},
  {g:'ambiente',n:"Cursi",i:'flor',c:'#d47fa8',k:["soft rock","power ballad","adult contemporary","balada","europop","schlager","teen pop","soft pop","bolero pop","eurovision"]},
  {g:'ambiente',n:"Adolescencia",i:'mando',c:'#5b8cf0',k:["pop punk","emo","emo rap","teen pop","hyperpop","bedroom pop","indie pop","post-hardcore","screamo","nu metal"]},
  {g:'ambiente',n:"Días de lluvia",i:'gota',c:'#5a7f9c',k:["slowcore","sadcore","shoegaze","trip hop","jazz vocal","bossa nova","folk indie","downtempo","dream pop","chillout"]},
  {g:'ambiente',n:"Amanecer",i:'sol',c:'#e5a020',k:["new age","acoustic","bossa nova","soft pop","chillout","downtempo","indie folk","ambient pop"]},
  {g:'ambiente',n:"Esperanzador",i:'arbol',c:'#3f9c6a',k:["gospel","uplifting trance","indie folk","post-rock","tropical house","future bass","folk rock"]},
  {g:'ambiente',n:"Descarado",i:'corona',c:'#b5761c',k:["gangsta rap","drill","crunk","trap latino","g-funk","hyphy","neoperreo","glam metal","dirty south","southern hip hop"]},
  {g:'ambiente',n:"Contemplativo",i:'libro',c:'#6a7f8c',k:["minimalism","post-rock","modern classical","piano solo","new age","drone","folk indie","neoclassical","early music","musica antigua"]},
  {g:'ambiente',n:"Muro de ruido",i:'altavoz',c:'#55505c',k:["noise","noise rock","harsh noise","power electronics","shoegaze","breakcore","no wave","drone"]},

  /* ---------- ORIGEN (46) ---------- */
  {g:'origen',n:"España",i:'bandera',c:'#c4342e',k:["spanish","spain","espanol","espana","flamenco","copla","rumba catalana","rock en espanol","spanish pop","spanish rock","spanish hip hop","madrid","barcelona","sevilla","andalucia","galician","galego","galicia","gallego","basque","euskadi","euskera","vasco","bilbao","espanyol","spanisch","espagnol"]},
  {g:'origen',n:"Cataluña",i:'bandera',c:'#d4903a',k:["catalan","catala","catalunya","rock catala"]},
  {g:'origen',n:"Reino Unido",i:'bandera',c:'#2f5fa0',k:["british","uk","england","english","britpop","london","manchester","madchester","scottish","welsh","uk garage","uk drill","uk grime","uk hardcore","uk funky"]},
  {g:'origen',n:"Estados Unidos",i:'bandera',c:'#3a6fb0',k:["american","usa","united states","new york","los angeles","chicago","atlanta","detroit","memphis","houston","compton","florida","virginia","texas","california","seattle","philadelphia","baltimore","new jersey","oakland","new orleans","nola","louisiana","memphis rap","cleveland","pittsburgh","missouri","north carolina"]},
  {g:'origen',n:"Irlanda",i:'hoja',c:'#2f8f4e',k:["irish","ireland","celtic"]},
  {g:'origen',n:"Francia",i:'bandera',c:'#3f5fa0',k:["french","france","francaise","variete francaise","chanson","french house","french rap","french pop","french r&b","francais"]},
  {g:'origen',n:"Alemania",i:'bandera',c:'#4a4a52',k:["german","germany","deutsch","krautrock","neue deutsche welle","berlin","hamburg"]},
  {g:'origen',n:"Italia",i:'bandera',c:'#2f8f5e',k:["italian","italy","italia","italo disco","italo dance","italian pop","italiano"]},
  {g:'origen',n:"Países Bajos",i:'bandera',c:'#e07f2f',k:["dutch","netherlands","holland","nederpop","dutch house","gabber","hollands","nederhop","nl"]},
  {g:'origen',n:"Suecia",i:'bandera',c:'#3a7fc0',k:["swedish","sweden","swedish death metal","swedish pop"]},
  {g:'origen',n:"Escandinavia",i:'copo',c:'#5a8fb0',k:["norwegian","norway","danish","denmark","finnish","finland","icelandic","iceland","nordic","suomirap","finlandes"]},
  {g:'origen',n:"Australia",i:'bandera',c:'#2f9e7e',k:["australian","australia","melbourne","sydney","new zealand"]},
  {g:'origen',n:"Canadá",i:'hoja',c:'#c4342e',k:["canadian","canada","toronto","montreal","quebec"]},
  {g:'origen',n:"Argentina",i:'bandera',c:'#6fa0d0',k:["argentine","argentina","argentino","rock nacional","argentine trap","argentine rock","buenos aires","tango","techengue"]},
  {g:'origen',n:"México",i:'bandera',c:'#2f8f5e',k:["mexican","mexico","musica mexicana","mariachi","ranchera","norteno","banda","corridos tumbados","mexican rock","mexican pop","regional mexican"]},
  {g:'origen',n:"Colombia",i:'bandera',c:'#e5c020',k:["colombian","colombia","vallenato","champeta","colombian pop"]},
  {g:'origen',n:"Puerto Rico",i:'palmera',c:'#3a6fb0',k:["puerto rico","puerto rican","boricua","san juan"]},
  {g:'origen',n:"Cuba",i:'palmera',c:'#c4342e',k:["cuban","cuba","son cubano","guaracha","timba","habana"]},
  {g:'origen',n:"República Dominicana",i:'palmera',c:'#3a5fa0',k:["dominican","dominicana","dembow dominicano","merengue tipico","bachata"]},
  {g:'origen',n:"Chile",i:'bandera',c:'#c4342e',k:["chilean","chile","chileno","reggaeton chileno","trap chileno"]},
  {g:'origen',n:"Brasil",i:'palmera',c:'#2f9e5e',k:["brazilian","brazil","brasil","samba","mpb","forro","pagode","funk carioca","brazilian funk","brazilian bass","brazilian phonk","bossa nova","sertanejo","sertanejo universitario","jovem guarda","tropicalia"]},
  {g:'origen',n:"Japón",i:'flor',c:'#d4568a',k:["japanese","japan","j-pop","j-rock","city pop","shibuya-kei","anime"]},
  {g:'origen',n:"Corea",i:'flor',c:'#a05cc0',k:["korean","korea","k-pop","k-hip hop","k-rock"]},
  {g:'origen',n:"África",i:'sol',c:'#c98a1f',k:["african","africa","nigerian","nigeria","ghanaian","ghana","south african","malian","senegalese","senegal","ethiopian","ethiopia","kenyan","kenya","congolese","angolan","gabon"]},
  {g:'origen',n:"Jamaica",i:'hoja',c:'#2f8f4e',k:["jamaican","jamaica","rocksteady","kingston","trenchtown"]},
  {g:'origen',n:"Rusia y Este",i:'bandera',c:'#5a6472',k:["russian","russia","polish","poland","ukrainian","czech","hungarian","romanian","serbian","balkan","hardbass","lithuanian","latvian","estonian","baltic","ukraine","kosovo","kosovan","albanian","lituano"]},
  {g:'origen',n:"Andalucía",i:'sol',c:'#d4903a',k:["andalusian","andalucia","andaluz","sevilla","granada","malaga","cadiz","sevillanas"]},
  {g:'origen',n:"Madrid",i:'ciudad',c:'#c4342e',k:["madrid","movida","movida madrilena","madrileno"]},
  {g:'origen',n:"Canarias",i:'palmera',c:'#2f9e7e',k:["canarias","canary islands","canario","tenerife","las palmas"]},
  {g:'origen',n:"Perú",i:'montana',c:'#c4342e',k:["peruvian","peru","peruano","cumbia peruana","chicha"]},
  {g:'origen',n:"Venezuela",i:'bandera',c:'#e5c020',k:["venezuelan","venezuela","venezolano","caracas"]},
  {g:'origen',n:"Panamá",i:'palmera',c:'#3a6fb0',k:["panama","panamanian","panameno"]},
  {g:'origen',n:"Uruguay",i:'bandera',c:'#6fa0d0',k:["uruguayan","uruguay","uruguayo","montevideo","candombe"]},
  {g:'origen',n:"Bélgica",i:'bandera',c:'#e5c020',k:["belgian","belgium","belgica","new beat","jumpstyle"]},
  {g:'origen',n:"Grecia y Turquía",i:'sol',c:'#3a7fc0',k:["greek","greece","turkish","turkey","anatolian","anadolu"]},
  {g:'origen',n:"India",i:'flor',c:'#e07f2f',k:["indian","india","bhangra","bollywood","punjabi","desi"]},
  {g:'origen',n:"China",i:'flor',c:'#c4342e',k:["chinese","china","mandopop","cantopop","taiwanese"]},
  {g:'origen',n:"Oriente Medio",i:'luna',c:'#c98a1f',k:["arabic","middle eastern","rai","egyptian","lebanese","israeli","persian","turco"]},
  {g:'origen',n:"Nueva York",i:'ciudad',c:'#3a6fb0',k:["new york","nyc","brooklyn","bronx","queens","harlem","new york city"]},
  {g:'origen',n:"California",i:'sol',c:'#e5c020',k:["california","los angeles","west coast","compton","long beach","bay area","oakland","san francisco","hyphy"]},
  {g:'origen',n:"Atlanta",i:'ciudad',c:'#c98a1f',k:["atlanta","atl","decatur","east atlanta"]},
  {g:'origen',n:"Chicago",i:'ciudad',c:'#5a6472',k:["chicago","chicago house","chicago drill","chicago blues","windy city"]},
  {g:'origen',n:"Detroit",i:'engranaje',c:'#4a4a52',k:["detroit","motown","motor city","detroit techno"]},
  {g:'origen',n:"Miami",i:'palmera',c:'#2fa08a',k:["miami","florida","miami bass","south florida"]},
  {g:'origen',n:"Texas",i:'coche',c:'#b5761c',k:["texas","houston","austin","texan","screwed up click","dallas"]},
  {g:'origen',n:"Nueva Orleans",i:'copa',c:'#9a7b3f',k:["new orleans","nola","bounce music","louisiana"]},

  /* ---------- DECADAS (8) ---------- */
  {g:'decada',n:"Antes de 1960",i:'libro',c:'#8a6a4a',d:[1900,1959]},
  {g:'decada',n:"Años 60",i:'flor',c:'#b5761c',d:[1960,1969]},
  {g:'decada',n:"Años 70",i:'disco',c:'#d98c1f',d:[1970,1979]},
  {g:'decada',n:"Años 80",i:'teclado',c:'#a05cc0',d:[1980,1989]},
  {g:'decada',n:"Años 90",i:'mando',c:'#5b8cf0',d:[1990,1999]},
  {g:'decada',n:"Años 2000",i:'camara',c:'#2b9c8a',d:[2000,2009]},
  {g:'decada',n:"Años 2010",i:'auriculares',c:'#3f9c35',d:[2010,2019]},
  {g:'decada',n:"Años 2020",i:'chispa',c:'#e0563a',d:[2020,2029]},

  /* ---------- EPOCAS (11) ---------- */
  {g:'epoca',n:"Mi infancia",i:'mando',c:'#3aa8c0',d:[2001,2008]},
  {g:'epoca',n:"Mi época de la ESO",i:'teclado',c:'#5b8cf0',d:[2009,2013]},
  {g:'epoca',n:"Bachillerato y después",i:'libro',c:'#7a5cd6',d:[2014,2017]},
  {g:'epoca',n:"EDM: rave de los 90",i:'altavoz',c:'#b8202e',k:["rave","breakbeat","big beat","acid house","acid techno","jungle","happy hardcore","gabber","hardcore techno","eurodance","trance","techno","house","electronic","edm","dance","breaks"],y:[1988,1999]},
  {g:'epoca',n:"EDM: trance de los 2000",i:'espiral',c:'#8b7ce8',k:["trance","progressive trance","uplifting trance","vocal trance","hard trance","psytrance","goa"],y:[1999,2010]},
  {g:'epoca',n:"EDM: electro house",i:'rayo',c:'#a05cc0',k:["electro house","fidget house","dutch house","complextro","blog house","electroclash","dirty dutch","french house","nu rave"],y:[2005,2011]},
  {g:'epoca',n:"EDM: big room",i:'montana',c:'#e0563a',k:["big room","melbourne bounce","progressive house","festival","electro house","edm","bounce"],y:[2011,2016]},
  {g:'epoca',n:"EDM: trap y twerk",i:'niebla',c:'#8a4a2e',k:["edm trap","twerk","moombahton","jersey club","hybrid trap","trap","bass music"],y:[2011,2017]},
  {g:'epoca',n:"EDM: future y tropical",i:'palmera',c:'#2b9c8a',k:["future house","future bass","tropical house","deep house","melodic house","chillstep","slap house"],y:[2013,2019]},
  {g:'epoca',n:"EDM: riddim y bass",i:'onda',c:'#2b6c8a',k:["riddim","dubstep","deathstep","melodic bass","brostep","colour bass","drumstep","tearout"],y:[2015,2021]},
  {g:'epoca',n:"EDM: slap, techno y afro",i:'engranaje',c:'#4a5568',k:["slap house","hypertechno","hard techno","afro house","brazilian bass","tech house","hardgroove","techengue","rally house","organic house"],y:[2018,2035]},

  /* ---------- HITOS (4) ---------- */
  {g:'hito',n:"De las mejores de la historia",i:'trofeo',c:'#c9a227',L:'MEJORES'},
  {g:'hito',n:"Cambió la música",i:'rayo',c:'#c05c1f',L:'INFLUYENTES'},
  {g:'hito',n:"Fundó un género",i:'chispa',c:'#2f8f5e',L:'FUNDACIONALES'},
  {g:'hito',n:"Sampleada mil veces",i:'disco',c:'#5b8cf0',L:'SAMPLEADAS'}

];

const GRUPOS = [
  { id: 'genero',   nombre: 'Géneros',    icon: 'nota',     color: '#a3690f', que: 'Las familias grandes. Con estas solas ya puedes cruzar medio vault.' },
  { id: 'sub',      nombre: 'Subgéneros', icon: 'marcador', color: '#7a5cd6', que: 'El detalle fino: G-house, Boom bap, Flamenco urbano, Drift phonk, Northern soul…' },
  { id: 'ambiente', nombre: 'Ambiente',   icon: 'corazon',  color: '#d4568a', que: 'Para qué sirve cada cosa, no qué es. Es el eje que de verdad usas al buscar música.' },
  { id: 'origen',   nombre: 'Origen',     icon: 'bandera',  color: '#2f8f5e', que: 'De dónde viene, hasta el nivel de ciudad o región. Sale del país que traen las etiquetas de Last.fm, así que cubre menos.' },
  { id: 'decada',   nombre: 'Década',     icon: 'reloj',    color: '#5b8cf0', que: 'Sale de la fecha de lanzamiento, así que acierta siempre.' },
  { id: 'epoca',    nombre: 'Épocas',     icon: 'calendario', color: '#c05c1f', que: 'Tu vida y la del EDM. Las del EDM cruzan género Y año: “trance” a secas no dice de qué década es.' },
  { id: 'hito',     nombre: 'Hitos',      icon: 'trofeo',   color: '#c9a227', que: 'Listas hechas a mano, no palabras clave: lo que la crítica considera lo mejor, lo que cambió la música, lo que fundó un género y lo que todo el mundo ha sampleado.' }
];
const GRUPO_SOLO_OBRA = new Set(['decada', 'epoca', 'hito']);   // no tienen sentido en un artista

const ENFRENTADOS = [
  ["Metal","Reggaetón y urbano"],
  ["Metal","Latino"],
  ["Metal","Regional mexicano"],
  ["Metal","Clásica"],
  ["Metal","Musicales y teatro"],
  ["Metal","Navidad"],
  ["Clásica","Reggaetón y urbano"],
  ["Clásica","Trap"],
  ["Clásica","Rap y hip-hop"],
  ["Clásica","Hardstyle y hardcore"],
  ["Clásica","Punk"],
  ["Clásica","Dubstep y bass"],
  ["Country y folk","Reggaetón y urbano"],
  ["Country y folk","Hardstyle y hardcore"],
  ["Regional mexicano","Techno"],
  ["Regional mexicano","House"],
  ["Regional mexicano","Metal"],
  ["Punk","Reggaetón y urbano"],
  ["Navidad","Reggaetón y urbano"],
  ["Ópera","Trap"],
  ["Ópera","Reggaetón y urbano"],
  /* El flamenco y lo africano se cruzan de verdad alguna vez, pero cuando
     Last.fm pone "Flamenco Pop" primero y "Latin Afrobeats" el ultimo, lo
     que hay delante es flamenco. Gana el mejor colocado, no los dos. */
  ["Flamenco","Africano"],
  ["Flamenco","Country y folk"],
  ["Flamenco","Metal"],
  ["Africano","Country y folk"],
  ["Africano","Metal"],
  ["Africano","Clásica"]
];

const L_MEJORES = `
The Beatles :: A Day in the Life
The Beatles :: Hey Jude
The Beatles :: Strawberry Fields Forever
The Beatles :: Yesterday
The Beatles :: Something
The Beatles :: Let It Be
The Beatles :: Come Together
The Beatles :: In My Life
The Beatles :: Here Comes the Sun
The Beatles :: While My Guitar Gently Weeps
The Beatles :: Eleanor Rigby
The Beatles :: Norwegian Wood
The Beatles :: Help!
The Beatles :: Blackbird
The Rolling Stones :: (I Can't Get No) Satisfaction
The Rolling Stones :: Gimme Shelter
The Rolling Stones :: Sympathy for the Devil
The Rolling Stones :: Paint It Black
The Rolling Stones :: Wild Horses
The Rolling Stones :: You Can't Always Get What You Want
Bob Dylan :: Like a Rolling Stone
Bob Dylan :: Blowin' in the Wind
Bob Dylan :: The Times They Are a-Changin'
Bob Dylan :: Tangled Up in Blue
Bob Dylan :: Visions of Johanna
Bob Dylan :: Mr. Tambourine Man
Bob Dylan :: Knockin' on Heaven's Door
Marvin Gaye :: What's Going On
Marvin Gaye :: I Heard It Through the Grapevine
Marvin Gaye :: Let's Get It On
Marvin Gaye :: Sexual Healing
Aretha Franklin :: Respect
Aretha Franklin :: I Never Loved a Man
Aretha Franklin :: Chain of Fools
Sam Cooke :: A Change Is Gonna Come
Sam Cooke :: Bring It On Home to Me
Otis Redding :: (Sittin' On) The Dock of the Bay
Otis Redding :: Try a Little Tenderness
Ray Charles :: What'd I Say
Ray Charles :: Georgia on My Mind
Nina Simone :: Feeling Good
Nina Simone :: Sinnerman
Nina Simone :: I Put a Spell on You
Etta James :: At Last
Ben E. King :: Stand by Me
Percy Sledge :: When a Man Loves a Woman
The Righteous Brothers :: You've Lost That Lovin' Feelin'
The Ronettes :: Be My Baby
The Shangri-Las :: Leader of the Pack
The Supremes :: You Keep Me Hangin' On
The Temptations :: My Girl
The Temptations :: Papa Was a Rollin' Stone
Smokey Robinson :: The Tracks of My Tears
Stevie Wonder :: Superstition
Stevie Wonder :: I Wish
Stevie Wonder :: Sir Duke
Stevie Wonder :: Living for the City
Al Green :: Let's Stay Together
Bill Withers :: Ain't No Sunshine
Bill Withers :: Lean on Me
Curtis Mayfield :: Move On Up
Curtis Mayfield :: People Get Ready
Gladys Knight :: Midnight Train to Georgia
Donny Hathaway :: A Song for You
Roberta Flack :: Killing Me Softly with His Song
Elvis Presley :: Suspicious Minds
Elvis Presley :: Heartbreak Hotel
Elvis Presley :: Can't Help Falling in Love
Elvis Presley :: Jailhouse Rock
Johnny Cash :: Hurt
Johnny Cash :: Ring of Fire
Johnny Cash :: Folsom Prison Blues
Roy Orbison :: Crying
Roy Orbison :: Oh Pretty Woman
The Everly Brothers :: All I Have to Do Is Dream
Buddy Holly :: Not Fade Away
Jerry Lee Lewis :: Great Balls of Fire
Led Zeppelin :: Stairway to Heaven
Led Zeppelin :: Whole Lotta Love
Led Zeppelin :: Kashmir
Led Zeppelin :: Immigrant Song
Led Zeppelin :: Black Dog
Pink Floyd :: Comfortably Numb
Pink Floyd :: Wish You Were Here
Pink Floyd :: Another Brick in the Wall
Pink Floyd :: Time
Pink Floyd :: Money
Pink Floyd :: Shine On You Crazy Diamond
Queen :: Bohemian Rhapsody
Queen :: Don't Stop Me Now
Queen :: Under Pressure
Queen :: Somebody to Love
Queen :: We Will Rock You
David Bowie :: Heroes
David Bowie :: Life on Mars?
David Bowie :: Space Oddity
David Bowie :: Ziggy Stardust
David Bowie :: Changes
David Bowie :: Ashes to Ashes
David Bowie :: Rebel Rebel
The Who :: Baba O'Riley
The Who :: Won't Get Fooled Again
The Who :: My Generation
The Kinks :: Waterloo Sunset
The Kinks :: You Really Got Me
The Beach Boys :: God Only Knows
The Beach Boys :: Good Vibrations
The Beach Boys :: Wouldn't It Be Nice
Jimi Hendrix :: Purple Haze
Jimi Hendrix :: All Along the Watchtower
Jimi Hendrix :: Voodoo Child
Jimi Hendrix :: Little Wing
The Doors :: Light My Fire
The Doors :: Riders on the Storm
The Doors :: The End
Creedence Clearwater Revival :: Fortunate Son
Creedence Clearwater Revival :: Have You Ever Seen the Rain
The Velvet Underground :: Pale Blue Eyes
The Velvet Underground :: Sunday Morning
The Velvet Underground :: I'm Waiting for the Man
Simon & Garfunkel :: Bridge Over Troubled Water
Simon & Garfunkel :: The Sound of Silence
Joni Mitchell :: A Case of You
Joni Mitchell :: River
Joni Mitchell :: Both Sides Now
Neil Young :: Heart of Gold
Neil Young :: Old Man
Neil Young :: After the Gold Rush
Van Morrison :: Astral Weeks
Van Morrison :: Brown Eyed Girl
Leonard Cohen :: Hallelujah
Leonard Cohen :: Suzanne
Nick Drake :: Pink Moon
Nick Drake :: River Man
Jeff Buckley :: Hallelujah
Jeff Buckley :: Last Goodbye
Fleetwood Mac :: Dreams
Fleetwood Mac :: Go Your Own Way
Fleetwood Mac :: Landslide
Eagles :: Hotel California
Steely Dan :: Deacon Blues
Bruce Springsteen :: Born to Run
Bruce Springsteen :: Thunder Road
Bruce Springsteen :: Dancing in the Dark
Talking Heads :: Once in a Lifetime
Talking Heads :: This Must Be the Place
Talking Heads :: Psycho Killer
Joy Division :: Love Will Tear Us Apart
The Clash :: London Calling
The Clash :: Should I Stay or Should I Go
The Clash :: Train in Vain
Sex Pistols :: God Save the Queen
Ramones :: Blitzkrieg Bop
Patti Smith :: Because the Night
Television :: Marquee Moon
The Smiths :: There Is a Light That Never Goes Out
The Smiths :: How Soon Is Now?
The Smiths :: This Charming Man
The Cure :: Just Like Heaven
The Cure :: Boys Don't Cry
The Cure :: Lovesong
New Order :: Blue Monday
New Order :: Bizarre Love Triangle
Depeche Mode :: Enjoy the Silence
Depeche Mode :: Personal Jesus
The Police :: Every Breath You Take
The Police :: Roxanne
Prince :: Purple Rain
Prince :: When Doves Cry
Prince :: Kiss
Prince :: 1999
Michael Jackson :: Billie Jean
Michael Jackson :: Beat It
Michael Jackson :: Thriller
Michael Jackson :: Smooth Criminal
Michael Jackson :: Man in the Mirror
Madonna :: Like a Prayer
Madonna :: Vogue
Madonna :: Into the Groove
Whitney Houston :: I Will Always Love You
Whitney Houston :: I Wanna Dance with Somebody
Kate Bush :: Running Up That Hill
Kate Bush :: Wuthering Heights
Tracy Chapman :: Fast Car
Sinéad O'Connor :: Nothing Compares 2 U
Cyndi Lauper :: Time After Time
Tina Turner :: What's Love Got to Do with It
U2 :: With or Without You
U2 :: One
U2 :: Where the Streets Have No Name
R.E.M. :: Losing My Religion
R.E.M. :: Everybody Hurts
Nirvana :: Smells Like Teen Spirit
Nirvana :: Come as You Are
Nirvana :: Heart-Shaped Box
Nirvana :: All Apologies
Pearl Jam :: Alive
Pearl Jam :: Black
Soundgarden :: Black Hole Sun
Alice in Chains :: Would?
Radiohead :: Creep
Radiohead :: Paranoid Android
Radiohead :: Karma Police
Radiohead :: Everything in Its Right Place
Radiohead :: No Surprises
Radiohead :: Idioteque
Radiohead :: Weird Fishes
Oasis :: Wonderwall
Oasis :: Live Forever
Oasis :: Don't Look Back in Anger
Blur :: Song 2
Pulp :: Common People
The Verve :: Bitter Sweet Symphony
Massive Attack :: Teardrop
Massive Attack :: Unfinished Sympathy
Portishead :: Glory Box
Björk :: Hyperballad
Björk :: Army of Me
Beck :: Loser
Pixies :: Where Is My Mind?
Pixies :: Debaser
Sonic Youth :: Teen Age Riot
My Bloody Valentine :: Only Shallow
The Jesus and Mary Chain :: Just Like Honey
Neutral Milk Hotel :: In the Aeroplane Over the Sea
Elliott Smith :: Between the Bars
Jeff Mangum :: Holland 1945
The Strokes :: Last Nite
The Strokes :: Someday
The White Stripes :: Seven Nation Army
Arctic Monkeys :: Do I Wanna Know?
Arctic Monkeys :: 505
Arcade Fire :: Wake Up
Arcade Fire :: Rebellion (Lies)
LCD Soundsystem :: All My Friends
LCD Soundsystem :: Dance Yrself Clean
The Killers :: Mr. Brightside
Interpol :: Evil
Yeah Yeah Yeahs :: Maps
MGMT :: Time to Pretend
MGMT :: Kids
Vampire Weekend :: A-Punk
Sufjan Stevens :: Chicago
Bon Iver :: Skinny Love
Bon Iver :: Holocene
Fleet Foxes :: White Winter Hymnal
Tame Impala :: The Less I Know the Better
Tame Impala :: Let It Happen
Frank Ocean :: Pyramids
Frank Ocean :: Nights
Frank Ocean :: Thinkin Bout You
Kendrick Lamar :: Alright
Kendrick Lamar :: HUMBLE.
Kendrick Lamar :: m.A.A.d city
Kendrick Lamar :: King Kunta
Kanye West :: Runaway
Kanye West :: Stronger
Kanye West :: Jesus Walks
Kanye West :: Gold Digger
Kanye West :: Power
Jay-Z :: 99 Problems
Jay-Z :: Empire State of Mind
Nas :: N.Y. State of Mind
Nas :: The World Is Yours
The Notorious B.I.G. :: Juicy
The Notorious B.I.G. :: Big Poppa
2Pac :: Dear Mama
2Pac :: California Love
2Pac :: Changes
Dr. Dre :: Nuthin' but a G Thang
Snoop Dogg :: Gin and Juice
Wu-Tang Clan :: C.R.E.A.M.
Mobb Deep :: Shook Ones Part II
A Tribe Called Quest :: Can I Kick It?
OutKast :: Hey Ya!
OutKast :: Ms. Jackson
OutKast :: B.O.B.
Missy Elliott :: Get Ur Freak On
Lauryn Hill :: Doo Wop (That Thing)
Eminem :: Lose Yourself
Eminem :: Stan
Eminem :: The Real Slim Shady
50 Cent :: In da Club
Drake :: Hotline Bling
Beyoncé :: Crazy in Love
Beyoncé :: Single Ladies
Beyoncé :: Formation
Rihanna :: Umbrella
Amy Winehouse :: Back to Black
Amy Winehouse :: Rehab
Adele :: Rolling in the Deep
Adele :: Someone Like You
Lana Del Rey :: Video Games
Robyn :: Dancing On My Own
Daft Punk :: One More Time
Daft Punk :: Get Lucky
Daft Punk :: Around the World
Daft Punk :: Digital Love
The Chemical Brothers :: Block Rockin' Beats
The Prodigy :: Firestarter
Fatboy Slim :: Praise You
Underworld :: Born Slippy
Moby :: Porcelain
Aphex Twin :: Windowlicker
Burial :: Archangel
Four Tet :: Angel Echoes
Caribou :: Odessa
Jamie xx :: Loud Places
The xx :: Intro
James Blake :: Retrograde
Disclosure :: Latch
Avicii :: Wake Me Up
Avicii :: Levels
Swedish House Mafia :: Don't You Worry Child
Calvin Harris :: Feel So Close
Bee Gees :: Stayin' Alive
Bee Gees :: How Deep Is Your Love
ABBA :: Dancing Queen
ABBA :: The Winner Takes It All
Chic :: Le Freak
Donna Summer :: I Feel Love
Earth Wind & Fire :: September
Kool & the Gang :: Celebration
Sister Sledge :: We Are Family
Blondie :: Heart of Glass
Blondie :: Call Me
Bob Marley :: Redemption Song
Bob Marley :: Three Little Birds
Bob Marley :: Is This Love
Toots and the Maytals :: Pressure Drop
Jimmy Cliff :: The Harder They Come
Serge Gainsbourg :: Je t'aime moi non plus
Édith Piaf :: La Vie en Rose
Frank Sinatra :: My Way
Frank Sinatra :: Fly Me to the Moon
Frank Sinatra :: New York New York
Louis Armstrong :: What a Wonderful World
Billie Holiday :: Strange Fruit
Ella Fitzgerald :: Summertime
John Coltrane :: My Favorite Things
Miles Davis :: So What
Dave Brubeck :: Take Five
Nina Simone :: My Baby Just Cares for Me
Antônio Carlos Jobim :: Garota de Ipanema
Camarón de la Isla :: Como el Agua
Camarón de la Isla :: Volando Voy
Paco de Lucía :: Entre Dos Aguas
Rosalía :: Malamente
Rosalía :: Pienso en Tu Mirá
Rosalía :: Con Altura
C. Tangana :: Tú Me Dejaste de Querer
Héroes del Silencio :: Entre Dos Tierras
Los Planetas :: Segundo Premio
Extremoduro :: So Payaso
Joaquín Sabina :: 19 Días y 500 Noches
Joaquín Sabina :: Y Nos Dieron las Diez
Joan Manuel Serrat :: Mediterráneo
Mecano :: Hijo de la Luna
Mecano :: Me Cuesta Tanto Olvidarte
Radio Futura :: Escuela de Calor
Nacha Pop :: Chica de Ayer
Alaska y Dinarama :: A Quién le Importa
Los Rodríguez :: Sin Documentos
Manu Chao :: Me Gustas Tú
Manu Chao :: Clandestino
Ketama :: No Estamos Locos
Estopa :: La Raja de Tu Falda
Soda Stereo :: De Música Ligera
Gustavo Cerati :: Crimen
Charly García :: Demoliendo Hoteles
Luis Alberto Spinetta :: Muchacha Ojos de Papel
Sui Generis :: Confesiones de Invierno
Café Tacvba :: Eres
Caifanes :: La Célula Que Explota
Los Fabulosos Cadillacs :: Matador
Juan Luis Guerra :: Burbujas de Amor
Rubén Blades :: Pedro Navaja
Héctor Lavoe :: El Cantante
Celia Cruz :: La Vida Es un Carnaval
Buena Vista Social Club :: Chan Chan
Violeta Parra :: Gracias a la Vida
Silvio Rodríguez :: Ojalá
Caetano Veloso :: Sozinho
Gilberto Gil :: Aquele Abraço
Fela Kuti :: Zombie
Bad Bunny :: Tití Me Preguntó
Bad Bunny :: Safaera
Daddy Yankee :: Gasolina
`;

const L_INFLUYENTES = `
Bill Haley :: Rock Around the Clock
Elvis Presley :: Heartbreak Hotel
Chuck Berry :: Johnny B. Goode
The Beatles :: I Want to Hold Your Hand
The Beatles :: A Day in the Life
The Beatles :: Tomorrow Never Knows
The Beach Boys :: Good Vibrations
Bob Dylan :: Like a Rolling Stone
The Rolling Stones :: (I Can't Get No) Satisfaction
The Kinks :: You Really Got Me
The Who :: My Generation
Jimi Hendrix :: Purple Haze
Led Zeppelin :: Whole Lotta Love
Black Sabbath :: Paranoid
Deep Purple :: Smoke on the Water
Pink Floyd :: Money
Queen :: Bohemian Rhapsody
David Bowie :: Space Oddity
David Bowie :: Heroes
Kraftwerk :: Autobahn
Kraftwerk :: Trans-Europe Express
Donna Summer :: I Feel Love
Chic :: Good Times
The Sugarhill Gang :: Rapper's Delight
Grandmaster Flash :: The Message
Afrika Bambaataa :: Planet Rock
Run-DMC :: Walk This Way
Public Enemy :: Fight the Power
N.W.A :: Straight Outta Compton
Dr. Dre :: Nuthin' but a G Thang
The Notorious B.I.G. :: Juicy
2Pac :: California Love
Missy Elliott :: Get Ur Freak On
Kanye West :: Through the Wire
Kanye West :: Runaway
Kendrick Lamar :: Alright
Sex Pistols :: Anarchy in the U.K.
Ramones :: Blitzkrieg Bop
The Clash :: London Calling
Joy Division :: Love Will Tear Us Apart
New Order :: Blue Monday
The Smiths :: This Charming Man
Nirvana :: Smells Like Teen Spirit
Radiohead :: Paranoid Android
Radiohead :: Everything in Its Right Place
The Strokes :: Last Nite
The White Stripes :: Seven Nation Army
Arcade Fire :: Wake Up
LCD Soundsystem :: Losing My Edge
Michael Jackson :: Billie Jean
Michael Jackson :: Thriller
Madonna :: Like a Virgin
Prince :: When Doves Cry
Whitney Houston :: I Will Always Love You
Mariah Carey :: Fantasy
Britney Spears :: Baby One More Time
Destiny's Child :: Say My Name
Beyoncé :: Crazy in Love
Rihanna :: Umbrella
Lady Gaga :: Bad Romance
Robyn :: Dancing On My Own
Amy Winehouse :: Rehab
Adele :: Rolling in the Deep
Lana Del Rey :: Video Games
Frank Ocean :: Thinkin Bout You
Billie Eilish :: Bad Guy
The Weeknd :: Blinding Lights
Daft Punk :: Around the World
Daft Punk :: One More Time
The Prodigy :: Firestarter
The Chemical Brothers :: Block Rockin' Beats
Fatboy Slim :: The Rockafeller Skank
Underworld :: Born Slippy
Moby :: Play
Aphex Twin :: Windowlicker
Massive Attack :: Unfinished Sympathy
Portishead :: Sour Times
Burial :: Archangel
Skrillex :: Scary Monsters and Nice Sprites
Avicii :: Levels
Swedish House Mafia :: One
Martin Garrix :: Animals
Baauer :: Harlem Shake
Jack Ü :: Where Are Ü Now
Fisher :: Losing It
Bee Gees :: Stayin' Alive
ABBA :: Dancing Queen
Blondie :: Rapture
Gary Numan :: Cars
The Human League :: Don't You Want Me
Soft Cell :: Tainted Love
Depeche Mode :: Personal Jesus
Nine Inch Nails :: Closer
Rage Against the Machine :: Killing in the Name
Korn :: Blind
Linkin Park :: In the End
System of a Down :: Chop Suey!
Metallica :: Enter Sandman
Slipknot :: Wait and Bleed
My Chemical Romance :: Welcome to the Black Parade
Green Day :: Basket Case
Blink-182 :: All the Small Things
Bob Marley :: One Love
Shabba Ranks :: Dem Bow
Sean Paul :: Get Busy
Daddy Yankee :: Gasolina
Luis Fonsi :: Despacito
J Balvin :: Mi Gente
Bad Bunny :: Soy Peor
Rosalía :: Malamente
Ozuna :: Se Preparó
Karol G :: Tusa
PSY :: Gangnam Style
BTS :: Dynamite
Los del Río :: Macarena
Ricky Martin :: Livin' la Vida Loca
Shakira :: Whenever Wherever
Manu Chao :: Clandestino
Mecano :: Hijo de la Luna
Héroes del Silencio :: Entre Dos Tierras
Soda Stereo :: De Música Ligera
Camarón de la Isla :: La Leyenda del Tiempo
Paco de Lucía :: Entre Dos Aguas
Antônio Carlos Jobim :: Garota de Ipanema
Fela Kuti :: Zombie
Miriam Makeba :: Pata Pata
Ravi Shankar :: Raga Jog
John Cage :: 4'33"
Steve Reich :: Music for 18 Musicians
Philip Glass :: Glassworks
Brian Eno :: Music for Airports
Wendy Carlos :: Switched-On Bach
Vangelis :: Chariots of Fire
Ennio Morricone :: The Good the Bad and the Ugly
John Williams :: Star Wars Main Title
Hans Zimmer :: Time
Nobuo Uematsu :: One-Winged Angel
Koji Kondo :: Super Mario Bros. Theme
Frank Sinatra :: My Way
Louis Armstrong :: West End Blues
Billie Holiday :: Strange Fruit
Charlie Parker :: Ko-Ko
Miles Davis :: So What
John Coltrane :: Giant Steps
Ornette Coleman :: Lonely Woman
Herbie Hancock :: Rockit
James Brown :: Papa's Got a Brand New Bag
Sly and the Family Stone :: Family Affair
Parliament :: Flash Light
Marvin Gaye :: What's Going On
Stevie Wonder :: Superstition
Aretha Franklin :: Respect
Sam Cooke :: A Change Is Gonna Come
Robert Johnson :: Cross Road Blues
Muddy Waters :: Rollin' Stone
Howlin' Wolf :: Smokestack Lightnin'
Hank Williams :: Your Cheatin' Heart
Johnny Cash :: I Walk the Line
Dolly Parton :: Jolene
Willie Nelson :: On the Road Again
Woody Guthrie :: This Land Is Your Land
Joni Mitchell :: Both Sides Now
Leonard Cohen :: Hallelujah
Simon & Garfunkel :: The Sound of Silence
Neil Young :: Rockin' in the Free World
Bruce Springsteen :: Born in the U.S.A.
U2 :: Sunday Bloody Sunday
Bob Geldof :: Do They Know It's Christmas?
USA for Africa :: We Are the World
`;

const L_FUNDACIONALES = `
Jackie Brenston :: Rocket 88
Ike Turner :: Rocket 88
Chuck Berry :: Maybellene
Chuck Berry :: Johnny B. Goode
Chuck Berry :: Roll Over Beethoven
Bill Haley :: Rock Around the Clock
Elvis Presley :: That's All Right
Elvis Presley :: Hound Dog
Little Richard :: Tutti Frutti
Big Joe Turner :: Shake, Rattle and Roll
Fats Domino :: The Fat Man
Sister Rosetta Tharpe :: Strange Things Happening Every Day
Bo Diddley :: Bo Diddley
The Kingsmen :: Louie Louie
Link Wray :: Rumble
Dick Dale :: Misirlou
The Kinks :: You Really Got Me
The Sonics :: The Witch
The Trashmen :: Surfin' Bird
The Beatles :: Tomorrow Never Knows
The Beach Boys :: Good Vibrations
The Byrds :: Eight Miles High
The Velvet Underground :: Sister Ray
The Velvet Underground :: Heroin
The Stooges :: I Wanna Be Your Dog
The Stooges :: Search and Destroy
MC5 :: Kick Out the Jams
New York Dolls :: Personality Crisis
Ramones :: Blitzkrieg Bop
Sex Pistols :: Anarchy in the U.K.
The Damned :: New Rose
Television :: Marquee Moon
Patti Smith :: Gloria
Wire :: Three Girl Rhumba
Black Flag :: Nervous Breakdown
Minor Threat :: Straight Edge
Bad Brains :: Pay to Cum
Dead Kennedys :: California Über Alles
Buzzcocks :: Ever Fallen in Love
Joy Division :: Love Will Tear Us Apart
Joy Division :: She's Lost Control
Public Image Ltd :: Public Image
Gang of Four :: Damaged Goods
Bauhaus :: Bela Lugosi's Dead
Siouxsie and the Banshees :: Hong Kong Garden
The Cure :: A Forest
Throbbing Gristle :: Hamburger Lady
Cabaret Voltaire :: Nag Nag Nag
Suicide :: Ghost Rider
Kraftwerk :: Autobahn
Kraftwerk :: Trans-Europe Express
Kraftwerk :: The Robots
Kraftwerk :: Numbers
Kraftwerk :: Tour de France
Giorgio Moroder :: I Feel Love
Donna Summer :: I Feel Love
Can :: Halleluwah
Neu! :: Hallogallo
Tangerine Dream :: Phaedra
Brian Eno :: Music for Airports
Brian Eno :: An Ending (Ascent)
Wendy Carlos :: Switched-On Bach
Silver Apples :: Oscillations
Delia Derbyshire :: Doctor Who Theme
Afrika Bambaataa :: Planet Rock
The Sugarhill Gang :: Rapper's Delight
Grandmaster Flash :: The Message
Grandmaster Flash :: The Adventures of Grandmaster Flash on the Wheels of Steel
Kurtis Blow :: The Breaks
Run-DMC :: Sucker M.C.'s
Run-DMC :: Walk This Way
Schoolly D :: P.S.K. What Does It Mean?
Boogie Down Productions :: South Bronx
Eric B. & Rakim :: Eric B. Is President
Public Enemy :: Rebel Without a Pause
N.W.A :: Straight Outta Compton
Ice-T :: 6 in the Mornin'
Geto Boys :: Mind Playing Tricks on Me
DJ Screw :: June 27
Three 6 Mafia :: Tear da Club Up
UGK :: Front Back and Side to Side
Lil Jon :: Get Low
T.I. :: Rubber Band Man
Gucci Mane :: Icy
Young Jeezy :: Soul Survivor
Chief Keef :: I Don't Like
Lil Wayne :: A Milli
Kanye West :: Through the Wire
A Tribe Called Quest :: Can I Kick It?
De La Soul :: Me Myself and I
Beastie Boys :: Paul Revere
2 Live Crew :: Me So Horny
Frankie Knuckles :: Your Love
Jesse Saunders :: On and On
Marshall Jefferson :: Move Your Body
Phuture :: Acid Tracks
Mr. Fingers :: Can You Feel It
Farley Jackmaster Funk :: Love Can't Turn Around
Steve Silk Hurley :: Jack Your Body
Cybotron :: Clear
Juan Atkins :: Clear
Model 500 :: No UFO's
Derrick May :: Strings of Life
Rhythim Is Rhythim :: Strings of Life
Jeff Mills :: The Bells
Underground Resistance :: Jaguar
Robert Hood :: Minimal Nation
Basic Channel :: Phylyps Trak
Plastikman :: Spastik
Richie Hawtin :: Spastik
A Guy Called Gerald :: Voodoo Ray
808 State :: Pacific State
The KLF :: What Time Is Love?
The Prodigy :: Charly
The Prodigy :: Firestarter
The Shamen :: Ebeneezer Goode
Altern 8 :: Activ 8
Human Resource :: Dominator
Joey Beltram :: Energy Flash
Lennie De Ice :: We Are I.E.
Rebel MC :: Wickedest Sound
Goldie :: Timeless
Goldie :: Inner City Life
LTJ Bukem :: Music
Roni Size :: Brown Paper Bag
Ed Rush & Optical :: Wormhole
Photek :: Ni Ten Ichi Ryu
4hero :: Mr. Kirk's Nightmare
Shy FX :: Original Nuttah
Dillinja :: The Angels Fell
Aphex Twin :: Xtal
Aphex Twin :: Windowlicker
Autechre :: Basscad
Squarepusher :: My Red Hot Car
Boards of Canada :: Roygbiv
Massive Attack :: Unfinished Sympathy
Massive Attack :: Teardrop
Portishead :: Sour Times
Portishead :: Glory Box
Tricky :: Aftermath
DJ Shadow :: Midnight in a Perfect World
Burial :: Archangel
Burial :: Near Dark
Skream :: Midnight Request Line
Benga :: Night
Digital Mystikz :: Anti-War Dub
Horsepower Productions :: Gorgon Sound
El-B :: Ghost Story
Wiley :: Eskimo
Dizzee Rascal :: I Luv U
Skepta :: That's Not Me
So Solid Crew :: 21 Seconds
MJ Cole :: Sincere
Artful Dodger :: Re-Rewind
Todd Edwards :: Saved My Life
Daft Punk :: Da Funk
Daft Punk :: Around the World
Daft Punk :: One More Time
Stardust :: Music Sounds Better with You
Thomas Bangalter :: Music Sounds Better with You
Cassius :: Cassius 1999
Justice :: D.A.N.C.E.
Justice :: Genesis
Ed Banger :: Waters of Nazareth
Bloody Beetroots :: Warp
Skrillex :: Scary Monsters and Nice Sprites
Rusko :: Cockney Thug
Flux Pavilion :: Bass Cannon
Knife Party :: Internet Friends
Swedish House Mafia :: One
Swedish House Mafia :: Don't You Worry Child
Avicii :: Levels
Avicii :: Wake Me Up
Martin Garrix :: Animals
Dimitri Vegas & Like Mike :: Tremor
Alesso :: Calling
Zedd :: Clarity
Flume :: Never Be Like You
Rustie :: Slasherr
Hudson Mohawke :: Cbat
Baauer :: Harlem Shake
RL Grime :: Core
TNGHT :: Higher Ground
Jack Ü :: Where Are Ü Now
Marshmello :: Alone
Kygo :: Firestone
Robin Schulz :: Prayer in C
Klingande :: Jubel
Oliver Heldens :: Gecko
Tchami :: After Life
Malaa :: Bling Bling
Jauz :: Feel the Volume
Fisher :: Losing It
Meduza :: Piece of Your Heart
Imanbek :: Roses
Joel Corry :: Head & Heart
Dua Lipa :: Don't Start Now
Fred again.. :: Delilah
Bicep :: Glue
Charlotte de Witte :: Doppler
Amelie Lens :: Basiliek
DJ Snake :: Turn Down for What
Diplo :: Express Yourself
Major Lazer :: Pon de Floor
Dave Nada :: Moombahton
Bob Marley :: One Love
Bob Marley :: No Woman No Cry
Bob Marley :: Exodus
The Wailers :: Simmer Down
Toots and the Maytals :: Do the Reggay
Desmond Dekker :: Israelites
Prince Buster :: Al Capone
The Skatalites :: Guns of Navarone
King Tubby :: King Tubby Meets Rockers Uptown
Lee Scratch Perry :: Blackboard Jungle Dub
Augustus Pablo :: King Tubby Meets Rockers Uptown
U-Roy :: Wear You to the Ball
Yellowman :: Zungguzungguguzungguzeng
Wayne Smith :: Under Mi Sleng Teng
Shabba Ranks :: Dem Bow
Nando Boom :: Ellos Benia
El General :: Tu Pum Pum
DJ Playero :: Playero 37
Daddy Yankee :: Gasolina
Tego Calderón :: Pa' Que Retozen
Ivy Queen :: Quiero Bailar
N.O.R.E. :: Oye Mi Canto
Luny Tunes :: Mayor Que Yo
Don Omar :: Dale Don Dale
Wisin & Yandel :: Rakata
Bad Bunny :: Soy Peor
Ozuna :: Se Preparó
J Balvin :: Ay Vamos
Luis Fonsi :: Despacito
Rosalía :: Malamente
C. Tangana :: Mala Mujer
Yung Beef :: Ready Pa Morir
Kaydy Cain :: Fuck Tha Police
Robert Johnson :: Cross Road Blues
Muddy Waters :: Rollin' Stone
Howlin' Wolf :: Smokestack Lightnin'
B.B. King :: The Thrill Is Gone
John Lee Hooker :: Boogie Chillen'
Son House :: Death Letter
Charley Patton :: Pony Blues
Bessie Smith :: Downhearted Blues
Ma Rainey :: See See Rider Blues
W.C. Handy :: St. Louis Blues
Louis Armstrong :: West End Blues
Duke Ellington :: Take the A Train
Count Basie :: One O'Clock Jump
Benny Goodman :: Sing Sing Sing
Charlie Parker :: Ko-Ko
Dizzy Gillespie :: A Night in Tunisia
Miles Davis :: So What
Miles Davis :: Bitches Brew
John Coltrane :: Giant Steps
Ornette Coleman :: Lonely Woman
Dave Brubeck :: Take Five
Herbie Hancock :: Rockit
Herbie Hancock :: Chameleon
Sun Ra :: Space Is the Place
James Brown :: Papa's Got a Brand New Bag
James Brown :: Cold Sweat
James Brown :: Get Up (I Feel Like Being a) Sex Machine
Sly and the Family Stone :: Thank You
Parliament :: Flash Light
Funkadelic :: One Nation Under a Groove
The Meters :: Cissy Strut
Isaac Hayes :: Theme from Shaft
Curtis Mayfield :: Superfly
Marvin Gaye :: What's Going On
Ray Charles :: I Got a Woman
Sam Cooke :: A Change Is Gonna Come
Aretha Franklin :: Respect
Otis Redding :: Try a Little Tenderness
The Supremes :: Where Did Our Love Go
The Temptations :: Papa Was a Rollin' Stone
Stevie Wonder :: Superstition
Chic :: Good Times
Chic :: Le Freak
Donna Summer :: Love to Love You Baby
Sylvester :: You Make Me Feel (Mighty Real)
Gloria Gaynor :: I Will Survive
The Trammps :: Disco Inferno
Black Sabbath :: Black Sabbath
Black Sabbath :: Paranoid
Black Sabbath :: Iron Man
Led Zeppelin :: Whole Lotta Love
Deep Purple :: Smoke on the Water
Judas Priest :: Breaking the Law
Iron Maiden :: The Number of the Beast
Motörhead :: Ace of Spades
Venom :: Welcome to Hell
Metallica :: Master of Puppets
Slayer :: Angel of Death
Bathory :: A Fine Day to Die
Mayhem :: Freezing Moon
Death :: Zombie Ritual
Napalm Death :: You Suffer
Pantera :: Walk
Korn :: Blind
Nirvana :: Smells Like Teen Spirit
Pixies :: Debaser
Sonic Youth :: Teen Age Riot
My Bloody Valentine :: Only Shallow
Slint :: Good Morning Captain
Radiohead :: Paranoid Android
Radiohead :: Idioteque
The Smiths :: This Charming Man
R.E.M. :: Radio Free Europe
Talking Heads :: Once in a Lifetime
Devo :: Whip It
Blondie :: Rapture
The Human League :: Don't You Want Me
Depeche Mode :: Enjoy the Silence
New Order :: Blue Monday
Soft Cell :: Tainted Love
Gary Numan :: Cars
The Buggles :: Video Killed the Radio Star
Madonna :: Like a Prayer
Michael Jackson :: Billie Jean
Michael Jackson :: Thriller
Prince :: When Doves Cry
Whitney Houston :: I Wanna Dance with Somebody
Hank Williams :: Your Cheatin' Heart
Johnny Cash :: I Walk the Line
Patsy Cline :: Crazy
Bill Monroe :: Blue Moon of Kentucky
Willie Nelson :: On the Road Again
Dolly Parton :: Jolene
Bob Dylan :: Like a Rolling Stone
Bob Dylan :: Subterranean Homesick Blues
Woody Guthrie :: This Land Is Your Land
Simon & Garfunkel :: The Sound of Silence
Joni Mitchell :: Both Sides Now
Neil Young :: Heart of Gold
Nick Drake :: Pink Moon
Leonard Cohen :: Hallelujah
Camarón de la Isla :: La Leyenda del Tiempo
Camarón de la Isla :: Volando Voy
Paco de Lucía :: Entre Dos Aguas
Antonio Mairena :: Seguiriyas
Enrique Morente :: Omega
Ketama :: Vente Pa Madrid
Pata Negra :: Blues de la Frontera
Triana :: Abre la Puerta
Kiko Veneno :: Volando Voy
Los Chichos :: Quiero Ser Libre
Las Grecas :: Te Estoy Amando Locamente
Peret :: El Muerto Vivo
Gato Pérez :: Gitanitos y Morenos
Manu Chao :: Clandestino
Mano Negra :: Mala Vida
Héroes del Silencio :: Entre Dos Tierras
Radio Futura :: Escuela de Calor
Alaska y Dinarama :: A Quién le Importa
Nacha Pop :: Chica de Ayer
Los Planetas :: Segundo Premio
Extremoduro :: So Payaso
Violeta Parra :: Gracias a la Vida
Atahualpa Yupanqui :: Los Ejes de Mi Carreta
Carlos Gardel :: Mi Buenos Aires Querido
Astor Piazzolla :: Libertango
Celia Cruz :: Quimbara
Fania All-Stars :: Quítate Tú
Héctor Lavoe :: El Cantante
Willie Colón :: Che Che Colé
Rubén Blades :: Pedro Navaja
Juan Luis Guerra :: Ojalá Que Llueva Café
Buena Vista Social Club :: Chan Chan
Compay Segundo :: Chan Chan
Pérez Prado :: Mambo No. 5
Tito Puente :: Oye Como Va
Antônio Carlos Jobim :: Garota de Ipanema
João Gilberto :: Chega de Saudade
Caetano Veloso :: Tropicália
Gilberto Gil :: Domingo no Parque
Os Mutantes :: Bat Macumba
Jorge Ben :: Mas Que Nada
Fela Kuti :: Zombie
Fela Kuti :: Water No Get Enemy
Miriam Makeba :: Pata Pata
King Sunny Adé :: Ja Funmi
Youssou N'Dour :: 7 Seconds
Ali Farka Touré :: Diaraby
Manu Dibango :: Soul Makossa
Wizkid :: Ojuelegba
Burna Boy :: Ye
DJ Maphorisa :: Midnight Starring
Kabza De Small :: Sponono
Vico C :: La Recta Final
Ramón Orlando :: El Venao
Silvio Rodríguez :: Ojalá
`;

const L_SAMPLEADAS = `
The Winstons :: Amen Brother
James Brown :: Funky Drummer
James Brown :: Funky President
James Brown :: Give It Up or Turnit a Loose
James Brown :: The Payback
James Brown :: Get Up (I Feel Like Being a) Sex Machine
Lyn Collins :: Think (About It)
The J.B.'s :: The Grunt
Bobby Byrd :: I Know You Got Soul
The Incredible Bongo Band :: Apache
The Incredible Bongo Band :: Bongo Rock
Michael Viner :: Apache
The Honey Drippers :: Impeach the President
Melvin Bliss :: Synthetic Substitution
Skull Snaps :: It's a New Day
Lafayette Afro Rock Band :: Darkest Light
The Emotions :: Blind Alley
The Isley Brothers :: Footsteps in the Dark
The Isley Brothers :: Between the Sheets
Chic :: Good Times
Rick James :: Super Freak
Zapp :: More Bounce to the Ounce
Roger Troutman :: More Bounce to the Ounce
Kool & the Gang :: Jungle Boogie
Kool & the Gang :: N.T.
The Meters :: Handclapping Song
Billy Squier :: The Big Beat
Bob James :: Nautilus
Bob James :: Take Me to the Mardi Gras
Herbie Hancock :: Watermelon Man
Ramsey Lewis :: Les Fleurs
Roy Ayers :: Everybody Loves the Sunshine
Lou Donaldson :: Ode to Billie Joe
David Axelrod :: The Edge
Isaac Hayes :: Hyperbolicsyllabicsesquedalymistic
Isaac Hayes :: Ike's Rap II
Curtis Mayfield :: Move On Up
Marvin Gaye :: Inner City Blues
Al Green :: I'm Glad You're Mine
The Mohawks :: The Champ
Jimmy Castor Bunch :: It's Just Begun
Dennis Coffey :: Scorpio
Cymande :: Bra
Cymande :: Dove
Barry White :: I'm Gonna Love You Just a Little More Baby
Labi Siffre :: I Got The
Ann Peebles :: I Can't Stand the Rain
Aretha Franklin :: Rock Steady
Sly and the Family Stone :: Sing a Simple Song
The Turtles :: You Showed Me
The Beach Boys :: Good Vibrations
The Beatles :: Tomorrow Never Knows
The Doors :: Five to One
Led Zeppelin :: When the Levee Breaks
Led Zeppelin :: Kashmir
Black Sabbath :: Iron Man
Deep Purple :: Smoke on the Water
Queen :: Under Pressure
David Bowie :: Under Pressure
Kraftwerk :: Trans-Europe Express
Kraftwerk :: Numbers
Yellow Magic Orchestra :: Firecracker
Tom Tom Club :: Genius of Love
Fab 5 Freddy :: Change the Beat
Beside :: Change the Beat
Manzel :: Midnight Theme
Jean Michel Jarre :: Oxygene
Vangelis :: Blade Runner Blues
Ennio Morricone :: The Ecstasy of Gold
John Carpenter :: Halloween Theme
Lalo Schifrin :: Danube Incident
Loleatta Holloway :: Love Sensation
First Choice :: Let No Man Put Asunder
Taana Gardner :: Heartbeat
MFSB :: Love Is the Message
Double Exposure :: Ten Percent
Ce Ce Rogers :: Someday
Alison Limerick :: Where Love Lives
Robin S :: Show Me Love
Crystal Waters :: Gypsy Woman
Lil Louis :: French Kiss
Frankie Knuckles :: Your Love
Mr. Fingers :: Can You Feel It
Todd Terry :: Can You Party
Reese :: Just Want Another Chance
Kevin Saunderson :: Just Want Another Chance
Ce Ce Peniston :: Finally
Rufus & Chaka Khan :: Ain't Nobody
Diana Ross :: Love Hangover
Donna Summer :: I Feel Love
Giorgio Moroder :: Chase
Sister Nancy :: Bam Bam
Dawn Penn :: You Don't Love Me (No No No)
Dennis Brown :: Money in My Pocket
Barrington Levy :: Here I Come
Wayne Smith :: Under Mi Sleng Teng
Shabba Ranks :: Dem Bow
Sleng Teng :: Sleng Teng
Slick Rick :: La Di Da Di
Doug E. Fresh :: La Di Da Di
Eric B. & Rakim :: Paid in Full
Nas :: The World Is Yours
Mobb Deep :: Shook Ones Part II
Ol' Dirty Bastard :: Shimmy Shimmy Ya
Biz Markie :: Nobody Beats the Biz
Audio Two :: Top Billin'
T La Rock :: It's Yours
Rob Base :: It Takes Two
Public Enemy :: Bring the Noise
2Pac :: Ambitionz Az a Ridah
Toto :: Africa
Phil Collins :: In the Air Tonight
Peter Gabriel :: Sledgehammer
Steely Dan :: Black Cow
The Police :: Every Breath You Take
Fleetwood Mac :: Dreams
Stevie Nicks :: Edge of Seventeen
Hall & Oates :: I Can't Go for That
Michael Jackson :: Billie Jean
Nile Rodgers :: Le Freak
Daft Punk :: One More Time
Eddie Johns :: More Spell on You
Breakwater :: Fun
Tavares :: Don't Take Away the Music
The Sound of Philadelphia :: TSOP
Gwen McCrae :: Funky Sensation
Bill Withers :: Grandma's Hands
Bill Withers :: Ain't No Sunshine
Al Green :: Let's Stay Together
Otis Redding :: Try a Little Tenderness
Nina Simone :: Sinnerman
Nina Simone :: Feeling Good
Etta James :: I'd Rather Go Blind
The Undisputed Truth :: Smiling Faces Sometimes
The Delfonics :: Ready or Not Here I Come
The Dramatics :: In the Rain
Minnie Riperton :: Inside My Love
Aaliyah :: One in a Million
Whitney Houston :: It's Not Right but It's Okay
Crystal Waters :: Gypsy Woman
Luther Vandross :: Never Too Much
`;

const L_MEMES = `
Rick Astley :: Never Gonna Give You Up
Darude :: Sandstorm
Crazy Frog :: Axel F
PSY :: Gangnam Style
Baauer :: Harlem Shake
Smash Mouth :: All Star
O-Zone :: Dragostea Din Tei
Toto :: Africa
a-ha :: Take On Me
Rednex :: Cotton Eye Joe
Los del Río :: Macarena
Vengaboys :: Boom Boom Boom Boom
Vengaboys :: We Like to Party
Eiffel 65 :: Blue (Da Ba Dee)
Haddaway :: What Is Love
Aqua :: Barbie Girl
Las Ketchup :: Aserejé
Chumbawamba :: Tubthumping
The Weeknd :: Blinding Lights
Nickelback :: How You Remind Me
Daft Punk :: Technologic
Daft Punk :: Harder Better Faster Stronger
Europe :: The Final Countdown
Survivor :: Eye of the Tiger
Journey :: Don't Stop Believin'
Bonnie Tyler :: Total Eclipse of the Heart
Céline Dion :: My Heart Will Go On
Queen :: Bohemian Rhapsody
Living on a Prayer :: Bon Jovi
Bon Jovi :: Livin' on a Prayer
John Cena :: The Time Is Now
Kevin MacLeod :: Sandstorm
Gigi D'Agostino :: L'Amour Toujours
Basshunter :: Boten Anna
Basshunter :: DotA
Dr. Dre :: Still D.R.E.
Coolio :: Gangsta's Paradise
Vanilla Ice :: Ice Ice Baby
MC Hammer :: U Can't Touch This
Right Said Fred :: I'm Too Sexy
Los Umbrellos :: No Tengo Dinero
Ricardo Milos :: I Wanna Be a Hippy
Technohead :: I Wanna Be a Hippy
Scatman John :: Scatman
Dschinghis Khan :: Moskau
Boney M. :: Rasputin
Village People :: YMCA
Wham! :: Last Christmas
Mariah Carey :: All I Want for Christmas Is You
The Weather Girls :: It's Raining Men
Rockwell :: Somebody's Watching Me
Michael Sembello :: Maniac
Kenny Loggins :: Danger Zone
Tag Team :: Whoomp! (There It Is)
Los Lobos :: La Bamba
Ritchie Valens :: La Bamba
Trololo :: I Am Very Glad
Eduard Khil :: Trololo
Yakety Sax :: Boots Randolph
Boots Randolph :: Yakety Sax
Jimmy Fontana :: Il Mondo
El Chombo :: Dame Tu Cosita
El Chombo :: El Cubo de Leche
Ozuna :: Dame Tu Cosita
DJ Ötzi :: Hey Baby
Alan Walker :: Faded
Lil Nas X :: Old Town Road
Soulja Boy :: Crank That
Rebecca Black :: Friday
Ylvis :: The Fox
Psy :: Gentleman
LMFAO :: Party Rock Anthem
LMFAO :: Sexy and I Know It
Carly Rae Jepsen :: Call Me Maybe
Chuck Berry :: My Ding-a-Ling
Nyan Cat :: Nyan Cat
Caramella Girls :: Caramelldansen
Tom Jones :: Sex Bomb
Sabaton :: Primo Victoria
Camila Cabello :: Havana
Pitbull :: Fireball
Pitbull :: Timber
Flo Rida :: Low
Baha Men :: Who Let the Dogs Out
Los Del Mar :: Macarena
Zombie Nation :: Kernkraft 400
Sandstorm :: Darude
Eminem :: Without Me
System of a Down :: Chop Suey!
Rage Against the Machine :: Killing in the Name
Toto :: Hold the Line
Michael Jackson :: Smooth Criminal
Rick Ross :: Hustlin'
DJ Khaled :: All I Do Is Win
Fatboy Slim :: Right Here Right Now
Sean Paul :: Temperature
Shaggy :: It Wasn't Me
Los Tigres del Norte :: La Puerta Negra
La Sonora Dinamita :: Mi Cucu
Chico Che :: Uy Que Miedo
Grupo Bronco :: Que No Quede Huella
`;

const L_LIMINAL = `
Boards of Canada :: Dayvan Cowboy
Boards of Canada :: Roygbiv
Boards of Canada :: Olson
Burial :: Archangel
Burial :: Near Dark
Brian Eno :: Music for Airports
Brian Eno :: An Ending (Ascent)
Aphex Twin :: Xtal
Aphex Twin :: Rhubarb
Aphex Twin :: Avril 14th
Tim Hecker :: Harmony in Ultraviolet
William Basinski :: The Disintegration Loops
Stars of the Lid :: Requiem for Dying Mothers
Grouper :: Heavy Water
The Caretaker :: Everywhere at the End of Time
Leyland Kirby :: Everywhere at the End of Time
Macintosh Plus :: Lisa Frank 420
Vektroid :: Lisa Frank 420
Blank Banshee :: Teen Pregnancy
Chuck Person :: Eccojams
Oneohtrix Point Never :: Nobody Here
Mac DeMarco :: Chamber of Reflection
Radiohead :: Everything in Its Right Place
Radiohead :: Treefingers
Sigur Rós :: Untitled 3
Sigur Rós :: Svefn-g-englar
Slowdive :: Alison
Slowdive :: Souvlaki Space Station
Cocteau Twins :: Cherry-Coloured Funk
My Bloody Valentine :: Sometimes
Angelo Badalamenti :: Twin Peaks Theme
Angelo Badalamenti :: Laura Palmer's Theme
Julee Cruise :: Falling
Vangelis :: Blade Runner Blues
Vangelis :: Tears in Rain
Ryuichi Sakamoto :: Merry Christmas Mr. Lawrence
Nine Inch Nails :: A Warm Place
Portishead :: Roads
Massive Attack :: Teardrop
Nujabes :: Feather
Nujabes :: Aruarian Dance
Clams Casino :: I'm God
Yung Lean :: Kyoto
Bladee :: Be Nice 2 Me
Øneheart :: Snowfall
Reidenshi :: Snowfall
Cigarettes After Sex :: Apocalypse
Beach House :: Space Song
Deftones :: Digital Bath
Duster :: Inside Out
Duster :: Stratosphere
American Football :: Never Meant
Alex G :: Sorry
Elliott Smith :: Between the Bars
Sufjan Stevens :: Death with Dignity
Godspeed You! Black Emperor :: East Hastings
Explosions in the Sky :: Your Hand in Mine
Hiroshi Yoshimura :: Blink
Haruomi Hosono :: Talking
Susumu Yokota :: Long Long Silence After
Global Communication :: 14 31
The Orb :: Little Fluffy Clouds
KLF :: Chill Out
Moby :: Porcelain
DJ Shadow :: Midnight in a Perfect World
Gas :: Pop 1
Wolfgang Voigt :: Pop 1
Huerco S. :: A Sea of Love
Actress :: Hubble
Arca :: Anoche
`;

const LISTAS = { MEJORES: L_MEJORES, INFLUYENTES: L_INFLUYENTES, FUNDACIONALES: L_FUNDACIONALES, SAMPLEADAS: L_SAMPLEADAS, MEMES: L_MEMES, LIMINAL: L_LIMINAL };
const GRUPO_POR_ID = Object.fromEntries(GRUPOS.map(g => [g.id, g]));

/* Las expresiones se compilan una vez y el resultado se guarda POR CADENA DE
   GENERO, no por elemento: hay 1.497 cadenas distintas y 13.892 elementos, asi
   que cachear por cadena convierte 3,5 segundos en medio. */
/* Cuatro motores distintos, no uno:
     TAX_GEN    por palabra suelta (genero, subgenero, ambiente, origen)
     TAX_ANYO   solo por ano (decadas y tus epocas)
     TAX_EPOCA  palabra Y ano a la vez (las epocas del EDM: "trance" no dice
                de que decada es, y el ano solo no distingue trance de balada)
     TAX_LISTA  ni palabra ni ano: una lista escrita a mano */
const TAX_GEN   = TAXONOMIA.filter(t => t.k && !t.y);
const TAX_ANYO  = TAXONOMIA.filter(t => t.d);
const TAX_EPOCA = TAXONOMIA.filter(t => t.y && t.k);
const TAX_LISTA = TAXONOMIA.filter(t => t.L);
const TAX_DEC = TAX_ANYO;   // nombre viejo, se mantiene por compatibilidad
const SUB_PADRE = new Map(TAXONOMIA.filter(t => t.g === 'sub').map(t => [t.n, t.p]));
const _PARES_ENF = new Set(ENFRENTADOS.flatMap(([a, b]) => [a + '|' + b, b + '|' + a]));

/* Las listas hechas a mano, indexadas por "artista|obra". El titulo se limpia
   de todo lo que Spotify le cuelga (" - 2011 Remaster", "(feat. X)") porque
   la misma cancion aparece en el vault con cinco nombres distintos. */
const _RX_COLA = /\s*[-–—]\s*(19|20)?\d{0,4}\s*(remaster(ed)?|remasterizado|mono|stereo|single version|album version|radio edit|edit|live|en vivo|en directo|acoustic|version|deluxe|bonus|anniversary|re-?issue|instrumental|extended|club mix|original mix|from .*|feat\..*|with .*).*$/i;
const _RX_PAR = /\s*[\(\[][^\)\]]*(feat|ft|with|remaster|live|version|edit|mix|mono|stereo|bonus|deluxe|anniversary|from|soundtrack)[^\)\]]*[\)\]]/gi;
const obraDe = s => fold(s).replace(_RX_PAR, '').replace(_RX_COLA, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
let _idxListas = null;
function idxListas() {
  if (_idxListas) return _idxListas;
  _idxListas = new Map();   // "artista|obra" -> Set de nombres de lista
  for (const [nombre, txt] of Object.entries(LISTAS)) {
    for (const l of txt.split('\n')) {
      const p = l.split('::');
      if (p.length !== 2) continue;
      const k = obraDe(p[0]) + '|' + obraDe(p[1]);
      if (!_idxListas.has(k)) _idxListas.set(k, new Set());
      _idxListas.get(k).add(nombre);
    }
  }
  return _idxListas;
}
/* Una sola pasada por elemento: normalizar el titulo es caro y hacerlo una
   vez por lista multiplicaba por seis el coste de etiquetar. */
function listasDe(it) {
  const idx = idxListas(), porA = idxListasPorArtista();
  const t = obraDe(it.title);
  if (!t) return null;
  let r = null;
  for (const a of (it.artists || [])) {
    const fa = obraDe(a);
    const s = idx.get(fa + '|' + t);
    if (s) { r = r || new Set(); s.forEach(x => r.add(x)); }
    /* y si no cuadra clavado, vale que el título EMPIECE por el de la lista,
       pero por palabra entera: "Fame" no puede colarse en "Family Affair" */
    const cand = porA.get(fa);
    if (!cand) continue;
    for (const [obra, listas] of cand) {
      if (obra.length < 5 || obra === t) continue;
      if (t.startsWith(obra + ' ')) { r = r || new Set(); listas.forEach(x => r.add(x)); }
    }
  }
  return r;
}

/* Las mismas entradas agrupadas por artista, para mirar solo las suyas en vez
   de recorrer las de todas las listas por cada elemento del vault. */
let _idxListasArt = null;
function idxListasPorArtista() {
  if (_idxListasArt) return _idxListasArt;
  _idxListasArt = new Map();
  for (const [k, listas] of idxListas()) {
    const c = k.indexOf('|');
    const a = k.slice(0, c), obra = k.slice(c + 1);
    if (!_idxListasArt.has(a)) _idxListasArt.set(a, []);
    _idxListasArt.get(a).push([obra, listas]);
  }
  return _idxListasArt;
}
let _rxListo = false, _tagsPorGenero = null;
function tagsDeGeneroFold(g) {
  if (!_rxListo) {
    for (const t of TAX_GEN.concat(TAX_EPOCA)) t._rx = t.k.map(k => new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)'));
    _rxListo = true;
  }
  if (!_tagsPorGenero) _tagsPorGenero = new Map();
  let r = _tagsPorGenero.get(g);
  if (r === undefined) { r = TAX_GEN.filter(t => t._rx.some(x => x.test(g))); _tagsPorGenero.set(g, r); }
  return r;
}

/* Coherencia de familias.
   Las etiquetas de Last.fm las pone la gente, y la gente hace bromas: en este
   vault hay reggaeton de El Chombo etiquetado "Brutal Death Metal" y trap
   italiano etiquetado "Concerto". Sin filtro, esa broma se convierte en una
   etiqueta de Metal encima de una cancion de reggaeton.
   La regla: Last.fm devuelve sus etiquetas ordenadas por votos, asi que la
   primera vale mucho mas que la quinta. Cada familia puntua segun lo bien
   colocada que este su mejor palabra, y de dos familias enfrentadas se queda
   la mejor colocada — arrastrando consigo a sus subgeneros. Si empatan no se
   toca nada: en la duda, mejor de mas que de menos.
   Fuera de la lista de enfrentados quedan a proposito las fusiones que SI
   existen (flamenco urbano, country trap, rock andaluz). */
function tagsCoherentes(gs) {
  const set = new Set(), puntos = new Map();
  gs.forEach((g, i) => {
    const f = fold(g);
    for (const t of tagsDeGeneroFold(f)) {
      set.add(t);
      if (t.g === 'genero') puntos.set(t.n, Math.max(puntos.get(t.n) || 0, 1 / (1 + i)));
    }
  });
  if (puntos.size < 2) return set;
  const ns = [...puntos.keys()], fuera = new Set();
  for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
    if (!_PARES_ENF.has(ns[i] + '|' + ns[j])) continue;
    const a = puntos.get(ns[i]), b = puntos.get(ns[j]);
    if (Math.abs(a - b) > 1e-9) fuera.add(a < b ? ns[i] : ns[j]);
  }
  if (!fuera.size) return set;
  for (const t of [...set])
    if ((t.g === 'genero' && fuera.has(t.n)) || (t.g === 'sub' && fuera.has(SUB_PADRE.get(t.n)))) set.delete(t);
  return set;
}
/* La decada del ano de lanzamiento, ya corregido si lo corregiste. */
