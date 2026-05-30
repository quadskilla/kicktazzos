(() => {
const ASSETS = Array.from({ length: 152 }, (_, index) => `tazzos/${index + 1}.webp`);

const BACKS = [
  "tazzos back/back1.png"
];

const DEFAULT_BACK_IMAGE = BACKS[0];

const TYPES = {
  Atacante: { color: "#e45138" },
  Meia: { color: "#0f7d79" },
  Defensor: { color: "#5f6f7b" },
  Goleiro: { color: "#f0b429" }
};

const RARITIES = {
  Comum: { chance: 40, cost: 1, fragments: 3 },
  Incomum: { chance: 30, cost: 2, fragments: 5 },
  Raro: { chance: 20, cost: 3, fragments: 8 },
  Epico: { chance: 9, cost: 4, fragments: 12 },
  Lendario: { chance: 0.9, cost: 5, fragments: 18 },
  Mistico: { chance: 0.099, cost: 6, fragments: 28 },
  "Mistico Secreto": { chance: 0.001, cost: 7, fragments: 45, secret: true }
};

const TAZZO_TRADE_VALUES = {
  Comum: 1,
  Incomum: 3,
  Raro: 5,
  Epico: 15,
  Lendario: 50,
  Mistico: 150,
  "Mistico Secreto": 450
};

const MONSTERS = [
  mon("artilheiro-brasil", 1, "Menino Ney", ["Atacante"], "Mistico", 78, 89, 95, 94, "Atacante"),
  keeperCard("goleiro-brasil-alison", 2, ASSETS[1], "Allishow", "Epico", "extraTurn"),
  mon("vinicius-jr-tazzo", 3, "Vini Malvadeza", ["Atacante"], "Mistico", 82, 91, 97, 96, "Atacante"),
  mon("rodrygo-tazzo", 4, "Raiogo", ["Atacante"], "Lendario", 80, 88, 92, 90, "Atacante"),
  mon("raphinha-tazzo", 5, "Rafinhaço", ["Atacante"], "Epico", 79, 86, 90, 89, "Atacante"),
  mon("gabriel-martinelli-tazzo", 6, "Gabi Martelinho", ["Atacante"], "Epico", 81, 84, 88, 93, "Atacante"),
  mon("bruno-guimaraes-tazzo", 7, "Brunão Guias", ["Meia"], "Raro", 86, 82, 85, 79, "Meia"),
  mon("casemiro-tazzo", 8, "Caseirão", ["Meia"], "Comum", 91, 81, 78, 74, "Meia"),
  mon("lucas-paqueta-tazzo", 9, "Lukinhas Paquerá", ["Meia"], "Epico", 84, 84, 87, 82, "Meia"),
  mon("marquinhos-tazzo", 10, "Marquinhóis", ["Defensor"], "Raro", 88, 76, 79, 80, "Zagueiro"),
  mon("eder-militao-tazzo", 11, "Éder Milhantão", ["Defensor"], "Raro", 87, 75, 77, 83, "Zagueiro"),
  mon("danilo-tazzo", 12, "Dani Lô", ["Defensor"], "Comum", 85, 74, 76, 78, "Zagueiro"),
  mon("richarlison-tazzo", 13, "Richa Liso", ["Atacante"], "Epico", 84, 85, 82, 81, "Atacante"),
  mon("endrick-tazzo", 14, "Endrikito", ["Atacante"], "Lendario", 83, 87, 84, 86, "Atacante"),
  mon("savinho-tazzo", 15, "Sabinho", ["Atacante"], "Epico", 79, 82, 89, 88, "Atacante"),
  mon("joao-gomes-tazzo", 16, "Jão Gomos", ["Meia"], "Comum", 88, 78, 77, 80, "Meia"),
  mon("douglas-luiz-tazzo", 17, "Doug Lulz", ["Meia"], "Incomum", 86, 80, 79, 78, "Meia"),
  mon("andreas-pereira-tazzo", 18, "André Pira", ["Meia"], "Incomum", 82, 81, 80, 77, "Meia"),
  mon("bremer-tazzo", 19, "Bremerão", ["Defensor"], "Incomum", 89, 76, 72, 79, "Zagueiro"),
  mon("gabriel-magalhaes-tazzo", 20, "Gabi Magalha", ["Defensor"], "Epico", 90, 77, 71, 76, "Zagueiro"),
  mon("alex-sandro-tazzo", 21, "Alek Sandrão", ["Defensor"], "Comum", 84, 75, 74, 77, "Zagueiro"),
  mon("wendell-tazzo", 22, "Wendeloco", ["Defensor"], "Incomum", 82, 74, 76, 81, "Zagueiro"),
  mon("julian-alvarez-tazzo", 23, "Juligol", ["Atacante"], "Epico", 82, 88, 84, 86, "Atacante"),
  mon("lautaro-martinez-tazzo", 24, "Toro Lau", ["Atacante"], "Raro", 86, 89, 82, 84, "Atacante"),
  mon("angel-di-maria-tazzo", 25, "Di Mágia", ["Atacante"], "Lendario", 79, 87, 90, 88, "Atacante"),
  mon("rodrigo-de-paul-tazzo", 26, "Rodri de Pau", ["Meia"], "Comum", 89, 79, 83, 82, "Meia"),
  mon("enzo-fernandez-tazzo", 27, "Enzinho", ["Meia"], "Incomum", 87, 84, 82, 81, "Meia"),
  mon("alexis-mac-allister-tazzo", 28, "Alexis Mac Alista", ["Meia"], "Comum", 85, 83, 84, 80, "Meia"),
  mon("cristian-romero-tazzo", 29, "Cuti Romerão", ["Defensor"], "Incomum", 92, 76, 72, 78, "Zagueiro"),
  mon("lisandro-martinez-tazzo", 30, "Licha Martelo", ["Defensor"], "Comum", 90, 74, 73, 77, "Zagueiro"),
  mon("nahuel-molina-tazzo", 31, "Molininha", ["Defensor"], "Incomum", 83, 80, 78, 85, "Zagueiro"),
  mon("nico-tagliaficoo-tazzo", 32, "Nico Tagliaficoo", ["Defensor"], "Raro", 88, 75, 76, 81, "Zagueiro"),
  mon("leandrao-paredao-tazzo", 33, "Leandrão Paredão", ["Meia"], "Epico", 86, 80, 82, 79, "Meia"),
  mon("nico-golez-tazzo", 34, "Nico Golez", ["Atacante"], "Epico", 80, 84, 83, 85, "Atacante"),
  mon("gonza-montilla-tazzo", 35, "Gonza Montilla", ["Defensor"], "Comum", 87, 77, 75, 81, "Zagueiro"),
  mon("marcos-acunhatico-tazzo", 36, "Marcos Acunhático", ["Defensor"], "Comum", 88, 78, 79, 80, "Zagueiro"),
  mon("guido-rodrigao-tazzo", 37, "Guido Rodrigão", ["Meia"], "Comum", 90, 75, 73, 74, "Meia"),
  mon("exequiel-palacioso-tazzo", 38, "Exequiel Palacioso", ["Meia"], "Raro", 84, 79, 80, 82, "Meia"),
  mon("german-pesadella-tazzo", 39, "Germán Pesadella", ["Defensor"], "Incomum", 91, 74, 71, 76, "Zagueiro"),
  mon("facu-medinada-tazzo", 40, "Facu Medinada", ["Defensor"], "Incomum", 89, 76, 74, 79, "Zagueiro"),
  mon("thiaguinho-almadaco-tazzo", 41, "Messias", ["Meia"], "Mistico Secreto", 90, 90, 99, 97, "Meia"),
  mon("paulo-dibala-tazzo", 42, "Paulo Dibala", ["Atacante"], "Epico", 79, 86, 88, 83, "Atacante", null, 21),
  goalie("emiliana-goleiro-tazzo", 43, "Emilianão", "Comum", "investidaTotal"),
  mon("judao-bellingol-tazzo", 44, "Judão Bellingol", ["Meia"], "Lendario", 84, 88, 91, 87, "Meia"),
  mon("bukayo-sacada-tazzo", 45, "Bukayo Sacada", ["Atacante"], "Epico", 83, 86, 92, 91, "Atacante"),
  mon("harri-kane-tazzo", 46, "Harri Kane", ["Atacante"], "Lendario", 88, 93, 85, 77, "Atacante"),
  mon("phil-fodao-tazzo", 47, "Phil Fodão", ["Atacante"], "Epico", 80, 88, 93, 86, "Atacante"),
  mon("declan-arroz-tazzo", 48, "Declan Arroz", ["Meia"], "Raro", 90, 82, 82, 79, "Meia"),
  mon("cole-palmeirao-tazzo", 49, "Cole Palmeirão", ["Meia"], "Epico", 79, 86, 90, 84, "Meia"),
  mon("trento-alexarnaldo-tazzo", 50, "Trento Alexarnaldo", ["Meia"], "Raro", 80, 87, 86, 82, "Meia"),
  mon("kobbie-mainu-tazzo", 51, "Kobbie Mainu", ["Meia"], "Comum", 82, 79, 87, 81, "Meia"),
  mon("antony-gordao-tazzo", 52, "Antony Gordão", ["Atacante"], "Epico", 80, 83, 85, 91, "Atacante"),
  mon("john-stonao-tazzo", 53, "John Stonão", ["Defensor"], "Comum", 87, 76, 78, 75, "Zagueiro"),
  mon("ollie-watkins-tazzo", 54, "Ollie Watkins", ["Atacante"], "Epico", 84, 87, 84, 90, "Atacante"),
  mon("jude-bellingham-tazzo", 55, "Jude Bellingham", ["Meia"], "Epico", 86, 88, 91, 87, "Meia"),
  mon("marcus-rashford-tazzo", 56, "Marcus Rashford", ["Atacante"], "Epico", 81, 87, 90, 93, "Atacante"),
  mon("jack-grealish-tazzo", 57, "Jack Grealish", ["Meia"], "Raro", 82, 84, 90, 83, "Meia"),
  mon("eberechi-eze-tazzo", 58, "Eberechi Eze", ["Meia"], "Comum", 80, 85, 89, 87, "Meia"),
  mon("ivan-toney-tazzo", 59, "Ivan Tonelada", ["Atacante"], "Comum", 85, 89, 81, 78, "Atacante"),
  mon("kyle-walker-tazzo", 60, "Kyle Walker", ["Defensor"], "Raro", 84, 77, 79, 95, "Zagueiro"),
  mon("reece-james-tazzo", 61, "Reece James", ["Defensor"], "Incomum", 84, 83, 82, 84, "Zagueiro"),
  mon("levi-colwill-tazzo", 62, "Levi Colwill", ["Defensor"], "Incomum", 85, 75, 74, 79, "Zagueiro"),
  mon("conor-gallagher-tazzo", 63, "Conor Gallagher", ["Meia"], "Incomum", 86, 80, 78, 84, "Meia"),
  mon("noni-madukeke-tazzo", 64, "Noni Madukeke", ["Atacante"], "Raro", 79, 84, 88, 87, "Atacante"),
  goalie("pickford-tazzo", 65, "Pickford", "Lendario", "teamHeal"),
  mon("ruben-diaszao-tazzo", 66, "Rúben Dibras", ["Defensor"], "Incomum", 85, 75, 71, 77, "Zagueiro"),
  mon("cristianildo-tazzo", 74, "Cristianildo", ["Atacante"], "Lendario", 89, 96, 88, 86, "Atacante"),
  mon("brunao-fernandes-tazzo", 68, "Brunão das Tabelas", ["Meia"], "Epico", 82, 91, 83, 75, "Meia"),
  mon("bernardao-silva-tazzo", 69, "Bernas Silvaço", ["Meia"], "Raro", 78, 80, 87, 79, "Meia"),
  mon("leaozao-tazzo", 70, "Leãozão", ["Atacante"], "Incomum", 79, 81, 81, 88, "Atacante"),
  mon("joao-felix-tazzo", 71, "João FeliX", ["Atacante"], "Comum", 88, 73, 80, 86, "Atacante"),
  mon("diogo-jota-tazzo", 72, "Diogo Jotá", ["Atacante"], "Comum", 77, 81, 81, 79, "Atacante"),
  mon("joao-cancel0-tazzo", 73, "João CanceL0", ["Defensor"], "Comum", 79, 78, 82, 83, "Zagueiro"),
  mon("nunao-mendes-tazzo", 67, "Nunão Mendes", ["Defensor"], "Comum", 77, 84, 83, 75, "Zagueiro"),
  mon("vitinhaco-tazzo", 75, "Vitinhaço", ["Meia"], "Comum", 77, 77, 84, 79, "Meia"),
  mon("gonca-ramos-tazzo", 76, "Gonça Ramos", ["Atacante"], "Incomum", 80, 82, 77, 78, "Atacante"),
  mon("diogo-dalotado-tazzo", 77, "Diogo Dalotado", ["Defensor"], "Comum", 79, 75, 74, 78, "Zagueiro"),
  mon("joao-nevez-tazzo", 78, "João Nevez", ["Meia"], "Comum", 76, 73, 77, 75, "Meia"),
  mon("ruben-nevasca-tazzo", 79, "Rúben Nevasca", ["Meia"], "Comum", 78, 77, 74, 71, "Meia"),
  mon("chico-conceicao-tazzo", 80, "Chico Conceição", ["Atacante"], "Comum", 71, 74, 80, 79, "Atacante"),
  mon("pedrao-neto-tazzo", 81, "Pedrão Neto", ["Atacante"], "Comum", 73, 76, 79, 80, "Atacante"),
  mon("joao-palhinhaco-tazzo", 82, "João Palhinhaço", ["Meia"], "Comum", 81, 72, 69, 70, "Meia"),
  mon("gonca-inacio-tazzo", 83, "Gonça Inácio", ["Defensor"], "Comum", 79, 71, 70, 72, "Zagueiro"),
  mon("tonho-silva-tazzo", 84, "Tonho Silva", ["Defensor"], "Comum", 77, 70, 69, 71, "Zagueiro"),
  mon("nelson-sem-medo-tazzo", 85, "Nelson Sem Medo", ["Defensor"], "Comum", 76, 73, 75, 79, "Zagueiro"),
  mon("matheusao-nunez-tazzo", 86, "Matheusão Nunez", ["Meia"], "Incomum", 78, 78, 81, 82, "Meia"),
  mon("robozao-cr-7-tazzo", 87, "Robozão CR 7", ["Atacante"], "Mistico Secreto", 90, 97, 89, 87, "Atacante"),
  goalie("diogo-costaco-tazzo", 88, "Diogo Costaço", "Epico", "substitution"),
  mon("malo-gustozo-tazzo", 89, "Malo Gustozo", ["Defensor"], "Comum", 78, 72, 80, 84, "Zagueiro"),
  mon("kylian-mbrappe-tazzo", 90, "Kylian Mbrappé", ["Atacante"], "Mistico", 88, 88, 87, 97, "Atacante"),
  mon("griezmanninho-tazzo", 91, "GriezManninho", ["Atacante"], "Epico", 81, 82, 83, 77, "Atacante"),
  mon("dembeletico-tazzo", 92, "Dembelético", ["Atacante"], "Lendario", 80, 80, 86, 90, "Atacante"),
  mon("edu-camavingaco-tazzo", 93, "Edu Camavingaço", ["Meia"], "Raro", 82, 78, 84, 83, "Meia"),
  mon("tchouamago-tazzo", 94, "TchouaMago", ["Meia"], "Raro", 84, 79, 80, 78, "Meia"),
  mon("theo-hernandezao-tazzo", 95, "Theo Hernandezão", ["Defensor"], "Epico", 82, 81, 80, 85, "Zagueiro"),
  mon("jules-konde-tazzo", 96, "Jules Kondê", ["Defensor"], "Raro", 83, 77, 78, 82, "Zagueiro"),
  mon("salibao-tazzo", 97, "Salibão", ["Defensor"], "Incomum", 84, 74, 77, 80, "Zagueiro"),
  mon("dayot-upa-mecano-tazzo", 98, "Dayot Upa-Mecano", ["Defensor"], "Comum", 84, 74, 72, 78, "Zagueiro"),
  mon("warren-zaire-emery-tazzo", 99, "Warren Zaïre-Emery", ["Meia"], "Incomum", 79, 76, 80, 81, "Meia"),
  mon("ibrahima-konate-tazzo", 100, "Ibrahima Konate", ["Defensor"], "Incomum", 84, 77, 72, 79, "Zagueiro"),
  mon("zinedao-sidane-tazzo", 101, "Zinedão Sidane", ["Meia"], "Mistico", 99, 80, 85, 50, "Meia"),
  mon("lucas-digne-tazzo", 102, "Lucas Digne", ["Defensor"], "Comum", 81, 74, 77, 75, "Zagueiro"),
  mon("ngolo-kantche-tazzo", 103, "N'Golo Kantche", ["Meia"], "Raro", 85, 73, 81, 80, "Meia"),
  mon("manu-kone-tazzo", 104, "Manu Kone", ["Meia"], "Incomum", 81, 75, 79, 78, "Meia"),
  mon("adrien-rabio-tazzo", 105, "Adrien Rabiô", ["Meia"], "Incomum", 82, 78, 79, 76, "Meia"),
  mon("bradley-barcolaco-tazzo", 106, "Bradley Barcolaço", ["Atacante"], "Epico", 77, 79, 84, 86, "Atacante"),
  mon("rayan-cheirki-tazzo", 107, "Rayan Cheirki", ["Meia"], "Raro", 76, 78, 85, 81, "Meia"),
  mon("deseje-doue-tazzo", 108, "Deseje Doue", ["Atacante"], "Raro", 78, 79, 83, 82, "Atacante"),
  mon("michael-olize-tazzo", 109, "Michael Olize", ["Atacante"], "Raro", 77, 80, 84, 81, "Atacante"),
  goalie("maignano-tazzo", 110, "Maignano", "Epico", "fullShot"),
  mon("joshua-kimmix-tazzo", 111, "Joshua Kimmix", ["Meia"], "Raro", 83, 79, 80, 77, "Meia"),
  mon("toni-rudigao-tazzo", 112, "Toni Rüdigão", ["Defensor"], "Lendario", 90, 85, 60, 90, "Zagueiro"),
  mon("nico-schlotterzi-tazzo", 113, "Nico Schlötterzi", ["Defensor"], "Comum", 84, 74, 73, 76, "Zagueiro"),
  mon("david-raumba-tazzo", 114, "David Raumba", ["Defensor"], "Incomum", 79, 75, 79, 81, "Zagueiro"),
  mon("robin-coque-tazzo", 115, "Robin Coque", ["Defensor"], "Comum", 83, 73, 72, 75, "Zagueiro"),
  mon("jamal-musiloko-tazzo", 116, "Jamal Musiloko", ["Meia"], "Lendario", 78, 82, 86, 85, "Meia"),
  mon("florian-wirtzo-tazzo", 117, "Florian Wirtzo", ["Meia"], "Epico", 77, 83, 85, 82, "Meia"),
  mon("aleksandar-pavlokic-tazzo", 118, "Aleksandar Pavlokic", ["Meia"], "Incomum", 81, 76, 80, 76, "Meia"),
  mon("leroy-saneca-tazzo", 119, "Leroy Saneca", ["Atacante"], "Epico", 77, 80, 84, 85, "Atacante"),
  mon("deniz-undavi-tazzo", 120, "Deniz Undavi", ["Atacante"], "Incomum", 80, 81, 79, 76, "Atacante"),
  mon("kai-havertzz-tazzo", 121, "Kai Havertzz", ["Atacante"], "Raro", 79, 81, 82, 79, "Atacante"),
  mon("jonathan-tahhh-tazzo", 122, "Jonathan Tahhh", ["Defensor"], "Incomum", 85, 75, 73, 76, "Zagueiro"),
  mon("robert-andrix-tazzo", 123, "Robert Andrix", ["Meia"], "Incomum", 84, 77, 75, 73, "Meia"),
  mon("pascal-grosss-tazzo", 124, "Pascal Grosss", ["Meia"], "Incomum", 80, 78, 79, 71, "Meia"),
  mon("maximilian-mittelstadtz-tazzo", 125, "Maximilian Mittelstadtz", ["Defensor"], "Incomum", 80, 76, 78, 79, "Zagueiro"),
  mon("benjamin-henricks-tazzo", 126, "Benjamin Henricks", ["Defensor"], "Incomum", 79, 75, 79, 81, "Zagueiro"),
  mon("waldemar-antonn-tazzo", 127, "Waldemar Antonn", ["Defensor"], "Comum", 83, 74, 72, 75, "Zagueiro"),
  mon("chris-fuhrick-tazzo", 128, "Chris Führick", ["Atacante"], "Incomum", 76, 79, 82, 81, "Atacante"),
  mon("serge-gnabryx-tazzo", 129, "Serge Gnabryx", ["Atacante"], "Epico", 77, 81, 83, 83, "Atacante"),
  mon("nikolai-fullking-tazzo", 130, "Nikolai Fullking", ["Atacante"], "Incomum", 82, 83, 75, 72, "Atacante"),
  goalie("neuerz-tazzo", 131, "Neuerz", "Lendario", "extraTurn"),
  mon("laminho-jamal-tazzo", 132, "Laminho Jamal", ["Atacante"], "Mistico", 77, 82, 87, 86, "Atacante"),
  mon("nicao-williams-tazzo", 133, "Nicão Williams", ["Atacante"], "Lendario", 78, 81, 85, 88, "Atacante"),
  mon("pedrito-gonzalaz-tazzo", 134, "Pedrito Gonzalaz", ["Meia"], "Epico", 79, 79, 86, 79, "Meia"),
  mon("gavito-paellaz-tazzo", 135, "Gavito Paellaz", ["Meia"], "Raro", 81, 78, 83, 80, "Meia"),
  mon("danito-olmito-tazzo", 136, "Danito Olmito", ["Meia"], "Raro", 78, 81, 82, 79, "Meia"),
  mon("rodrito-hernandes-tazzo", 137, "Rodrito Hernandes", ["Meia"], "Lendario", 85, 80, 81, 75, "Meia"),
  mon("fabiao-ruizito-tazzo", 138, "Fabião Ruizito", ["Meia"], "Incomum", 82, 79, 81, 76, "Meia"),
  mon("alvarito-moraton-tazzo", 139, "Alvarito Moraton", ["Atacante"], "Raro", 81, 83, 78, 77, "Atacante"),
  mon("alejandro-grimaldon-tazzo", 140, "Alejandro Grimaldon", ["Defensor"], "Incomum", 79, 77, 81, 81, "Zagueiro"),
  mon("andres-iniestion-tazzo", 141, "Andres Iniestión", ["Meia"], "Mistico Secreto", 99, 78, 95, 86, "Meia"),
  mon("mikeao-oyarzabao-tazzo", 142, "Mikeão Oyarzabão", ["Atacante"], "Raro", 81, 81, 80, 77, "Atacante"),
  mon("ferrano-torraco-tazzo", 143, "Ferrano Torraço", ["Atacante"], "Raro", 79, 81, 81, 81, "Atacante"),
  mon("mikelao-merinao-tazzo", 144, "Mikelão Merinão", ["Meia"], "Incomum", 83, 79, 79, 75, "Meia"),
  mon("aymerico-laporton-tazzo", 145, "Aymerico Laportón", ["Defensor"], "Comum", 84, 75, 74, 74, "Zagueiro"),
  mon("nacho-fernandao-tazzo", 146, "Nacho Fernandão", ["Defensor"], "Comum", 83, 73, 73, 73, "Zagueiro"),
  mon("pauzinho-cubarsao-tazzo", 147, "Pauzinho Cubarsão", ["Defensor"], "Comum", 81, 73, 76, 74, "Zagueiro"),
  mon("jesusao-navaza-tazzo", 148, "Jesusão Navaza", ["Defensor"], "Incomum", 77, 75, 79, 80, "Zagueiro"),
  mon("marquito-casadao-tazzo", 149, "Marquito Casadão", ["Meia"], "Comum", 80, 74, 77, 75, "Meia"),
  mon("yerinho-pinudo-tazzo", 150, "Yerinho Pinudo", ["Atacante"], "Raro", 77, 78, 81, 83, "Atacante"),
  mon("bryano-zaragoza-tazzo", 151, "Bryano Zaragoza", ["Atacante"], "Raro", 76, 77, 83, 85, "Atacante"),
  goalie("unai-simonz-tazzo", 152, "Unai Simonz", "Epico", "freeSwap")
];

const MONSTER_BY_ID = Object.fromEntries(MONSTERS.map((monster) => [monster.id, monster]));
MONSTER_BY_ID["artilheiro-brasil"].holoImage = "tazzos/1 (2).webp";
MONSTER_BY_ID["vinicius-jr-tazzo"].holoImage = "tazzos/3 (2).webp";
MONSTER_BY_ID["rodrygo-tazzo"].holoImage = "tazzos/4 (2).webp";
MONSTER_BY_ID["endrick-tazzo"].holoImage = "tazzos/14 (2).webp";
MONSTER_BY_ID["angel-di-maria-tazzo"].holoImage = "tazzos/25 (2).webp";
MONSTER_BY_ID["thiaguinho-almadaco-tazzo"].holoImage = "tazzos/41 (2).webp";
MONSTER_BY_ID["judao-bellingol-tazzo"].holoImage = "tazzos/44 (2).webp";
MONSTER_BY_ID["harri-kane-tazzo"].holoImage = "tazzos/46 (2).webp";
MONSTER_BY_ID["pickford-tazzo"].holoImage = "tazzos/65 (2).webp";
MONSTER_BY_ID["cristianildo-tazzo"].holoImage = "tazzos/74 (2).webp";
MONSTER_BY_ID["robozao-cr-7-tazzo"].holoImage = "tazzos/87 (2).webp";
MONSTER_BY_ID["kylian-mbrappe-tazzo"].holoImage = "tazzos/90 (2).webp";
MONSTER_BY_ID["dembeletico-tazzo"].holoImage = "tazzos/92 (2).webp";
MONSTER_BY_ID["zinedao-sidane-tazzo"].holoImage = "tazzos/101 (2).webp";
MONSTER_BY_ID["toni-rudigao-tazzo"].holoImage = "tazzos/112 (2).webp";
MONSTER_BY_ID["leroy-saneca-tazzo"].holoImage = "tazzos/119 (2).webp";
MONSTER_BY_ID["neuerz-tazzo"].holoImage = "tazzos/131 (2).webp";
MONSTER_BY_ID["laminho-jamal-tazzo"].holoImage = "tazzos/132 (2).webp";
MONSTER_BY_ID["andres-iniestion-tazzo"].holoImage = "tazzos/141(2).webp";

const RANKS = [
  { name: "Tampinha", min: 0 },
  { name: "Recreio", min: 120 },
  { name: "Crocante", min: 280 },
  { name: "Holografico", min: 520 },
  { name: "Lendario", min: 840 },
  { name: "Mestre dos Tazzos", min: 1250 }
];

const TOURNAMENTS = [
  { id: "daily", name: "Diario", entry: 180, reward: 420, difficulty: 0.45, prize: "Merreis" },
  { id: "weekly", name: "Semanal", entry: 420, reward: 980, difficulty: 0.58, prize: "Merreis e fragmentos" },
  { id: "event", name: "Evento Monstronho", entry: 300, reward: 0, difficulty: 0.52, prize: "Pacotinho Recheado" }
];

const SHOP_ITEMS = [
  { id: "starter-bundle", type: "merreis", featured: true, name: "Pacote Iniciante", merreis: 50000, fragments: 1000, legendaryCards: 3, oneTime: true, priceCents: 990, currency: "BRL", priceLabel: "R$ 9,90", image: "assets/pacote_iniciante.png", bannerImage: "assets/banner_promo.png", note: "Compra unica por conta: 50 mil Merreis, 1000 fragmentos e 3 tazzos lendarios aleatorios." },
  { id: "merreis-2000", type: "merreis", name: "Bolso de Merreis", merreis: 2000, priceCents: 499, currency: "BRL", priceLabel: "R$ 4,99", image: "assets/icones/4,99 new.png", badgeImage: "assets/icones/oferta especial.png", badgeAlt: "Oferta especial", note: "Recarga rapida para abrir pacotinhos e entrar em torneios." },
  { id: "merreis-10000", type: "merreis", name: "Combo Recreio", merreis: 10000, priceCents: 1499, currency: "BRL", priceLabel: "R$ 14,99", image: "assets/icones/14,99 new.png", badgeImage: "assets/icones/mais vendido.png", badgeAlt: "Mais vendido", note: "Mais folego para comprar pacotinhos e melhorar seu time." },
  { id: "merreis-30000", type: "merreis", name: "Cofre Campeao", merreis: 30000, priceCents: 2499, currency: "BRL", priceLabel: "R$ 24,99", image: "assets/icones/24,99 new.png", badgeImage: "assets/icones/melhor custo beneficio.png", badgeAlt: "Melhor custo beneficio", note: "Pacote grande para colecionadores que querem acelerar a liga." }
];

const PACKS = [
  { id: "simples", name: "Simples", cards: 1, cost: 150, note: "1 tazzo", image: "assets/pack-simples.png", openImage: "assets/pack-simples-open.png", storeImage: "assets/pacotinhos/simples.png" },
  { id: "crocante", name: "Crocante", cards: 3, cost: 400, note: "3 tazzos", image: "assets/pack-crocante.png", openImage: "assets/pack-crocante-open.png", storeImage: "assets/pacotinhos/crocante.png", badgeImage: "assets/icones/oferta.png", badgeAlt: "Oferta" },
  { id: "recheado", name: "Recheado", cards: 5, cost: 600, note: "5 tazzos, raro garantido", image: "assets/pack-recheado.png", openImage: "assets/pack-recheado-open.png", storeImage: "assets/pacotinhos/recheado.png", badgeImage: "assets/icones/raro_garantido.png", badgeAlt: "Raro garantido" },
  { id: "familia", name: "Familia", cards: 8, cost: 800, note: "8 tazzos", image: "assets/pack-familia.png", openImage: "assets/pack-familia-open.png", storeImage: "assets/pacotinhos/familia.png", badgeImage: "assets/icones/mais popular.png", badgeAlt: "Mais popular" },
  { id: "atacado", name: "Atacado", cards: 40, cost: 3500, note: "40 tazzos", image: "assets/bulck_closed.png", openImage: "assets/bulck_opened.png", storeImage: "assets/pacotinhos/atacado.png", badgeImage: "assets/icones/melhor_valor.png", badgeAlt: "Melhor valor" }
];

const MISSIONS = [
  { id: "login", title: "Fazer login", target: 1, reward: 100, period: "daily", event: "login" },
  { id: "pack", title: "Abrir 1 pacotinho", target: 1, reward: 100, period: "daily", event: "pack" },
  { id: "battle", title: "Jogar 1 batalha", target: 1, reward: 150, period: "daily", event: "battle" },
  { id: "win", title: "Vencer 1 batalha", target: 1, reward: 250, period: "daily", event: "win" },
  { id: "push", title: "Empurrar contra borda", target: 1, reward: 180, period: "daily", event: "push" },
  { id: "keeper", title: "Usar habilidade de goleiro", target: 1, reward: 160, period: "daily", event: "keeper" },
  { id: "collision", title: "Causar 1 colisao", target: 1, reward: 200, period: "daily", event: "collision" },
  { id: "trade", title: "Fazer 1 troca", target: 1, reward: 200, period: "daily", event: "trade" },
  { id: "evolve", title: "Melhorar 1 tazzo", target: 1, reward: 220, period: "daily", event: "evolve" },
  { id: "ranked", title: "Disputar ranqueada", target: 1, reward: 180, period: "daily", event: "ranked" },
  { id: "tournament", title: "Entrar em torneio", target: 1, reward: 240, period: "daily", event: "tournament" },
  { id: "gift", title: "Enviar presente", target: 1, reward: 120, period: "daily", event: "gift" },
  { id: "weekly-packs", title: "Abrir 10 pacotinhos", target: 10, reward: 850, fragments: 12, period: "weekly", event: "pack" },
  { id: "weekly-battles", title: "Jogar 8 batalhas", target: 8, reward: 1000, fragments: 10, period: "weekly", event: "battle" },
  { id: "weekly-wins", title: "Vencer 3 batalhas", target: 3, reward: 1200, fragments: 16, period: "weekly", event: "win" },
  { id: "weekly-ranked", title: "Disputar 5 ranqueadas", target: 5, reward: 1100, fragments: 14, period: "weekly", event: "ranked" },
  { id: "weekly-trades", title: "Fazer 3 trocas", target: 3, reward: 900, fragments: 10, period: "weekly", event: "trade" },
  { id: "weekly-evolve", title: "Melhorar 3 tazzos", target: 3, reward: 1250, fragments: 18, period: "weekly", event: "evolve" },
  { id: "monthly-packs", title: "Abrir 35 pacotinhos", target: 35, reward: 3200, fragments: 45, period: "monthly", event: "pack" },
  { id: "monthly-battles", title: "Jogar 30 batalhas", target: 30, reward: 3600, fragments: 40, period: "monthly", event: "battle" },
  { id: "monthly-wins", title: "Vencer 12 batalhas", target: 12, reward: 4200, fragments: 60, period: "monthly", event: "win" },
  { id: "monthly-ranked", title: "Disputar 20 ranqueadas", target: 20, reward: 4400, fragments: 58, period: "monthly", event: "ranked" },
  { id: "monthly-tournaments", title: "Entrar em 6 torneios", target: 6, reward: 3800, fragments: 48, period: "monthly", event: "tournament" },
  { id: "monthly-evolve", title: "Melhorar 10 tazzos", target: 10, reward: 4600, fragments: 70, period: "monthly", event: "evolve" },
  { id: "monthly-gifts", title: "Enviar 12 presentes", target: 12, reward: 2600, fragments: 36, period: "monthly", event: "gift" },
  { id: "album-brasil", title: "Completar Brazukas", target: 22, reward: 1000, period: "album", scope: "album", range: [1, 22] },
  { id: "album-argentina", title: "Completar Hermanos", target: 21, reward: 1000, period: "album", scope: "album", range: [23, 43] },
  { id: "album-inglaterra", title: "Completar Cha United", target: 22, reward: 1100, period: "album", scope: "album", range: [44, 65] },
  { id: "album-portugal", title: "Completar Porto de Galos", target: 23, reward: 1300, period: "album", scope: "album", range: [66, 88] },
  { id: "album-franca", title: "Completar Cheirosos", target: 22, reward: 1300, period: "album", scope: "album", range: [89, 110] },
  { id: "album-alemanha", title: "Completar Cervejeiros", target: 21, reward: 1300, period: "album", scope: "album", range: [111, 131] },
  { id: "album-espanha", title: "Completar Touros", target: 21, reward: 1300, period: "album", scope: "album", range: [132, 152] }
];

const ECONOMY_REWARD_RULES = Object.freeze({
  trainingAi: { merreis: 25, dailyMatches: 10 },
  rankedWin: { merreis: 50, dailyMerreisCap: 1000 }
});

const SOCIAL_SHARE_REWARDS = [
  { id: "discord", name: "Discord", reward: 500, note: "Copie o convite e mande para um servidor ou amigo." },
  { id: "twitter", name: "X / Twitter", reward: 500, note: "Publique um convite rapido para chamar novos jogadores." },
  { id: "whatsapp", name: "WhatsApp", reward: 500, note: "Compartilhe com um grupo ou amigo." },
  { id: "telegram", name: "Telegram", reward: 500, note: "Envie o link para um chat ou canal." },
  { id: "facebook", name: "Facebook", reward: 500, note: "Compartilhe o jogo no seu feed." },
  { id: "reddit", name: "Reddit", reward: 500, note: "Abra um post com o link do jogo." }
];

const FRIENDS = [
  {
    id: "nina",
    name: "Nina Holo",
    rank: "Lendario",
    avatar: 18,
    team: ["vinicius-jr-tazzo", "lucas-paqueta-tazzo", "marquinhos-tazzo"],
    goalkeeper: "goleiro-brasil-alison",
    collection: ["goleiro-brasil-alison", "vinicius-jr-tazzo", "lucas-paqueta-tazzo", "marquinhos-tazzo", "angel-di-maria-tazzo", "artilheiro-brasil"],
    wants: ["endrick-tazzo", "gabriel-magalhaes-tazzo", "lautaro-martinez-tazzo"]
  },
  {
    id: "bia",
    name: "Bia Caps",
    rank: "Holografico",
    avatar: 47,
    team: ["savinho-tazzo", "bruno-guimaraes-tazzo", "eder-militao-tazzo"],
    goalkeeper: "goleiro-brasil-alison",
    collection: ["goleiro-brasil-alison", "savinho-tazzo", "bruno-guimaraes-tazzo", "eder-militao-tazzo", "raphinha-tazzo"],
    wants: ["rodrygo-tazzo", "joao-gomes-tazzo", "bremer-tazzo"]
  },
  {
    id: "lipe",
    name: "Lipe Snack",
    rank: "Crocante",
    avatar: 23,
    team: ["julian-alvarez-tazzo", "enzo-fernandez-tazzo", "cristian-romero-tazzo"],
    goalkeeper: "goleiro-brasil-alison",
    collection: ["goleiro-brasil-alison", "julian-alvarez-tazzo", "enzo-fernandez-tazzo", "cristian-romero-tazzo", "lautaro-martinez-tazzo", "rodrigo-de-paul-tazzo"],
    wants: ["artilheiro-brasil", "alexis-mac-allister-tazzo", "lisandro-martinez-tazzo"]
  },
  {
    id: "madu",
    name: "Madu Tazo",
    rank: "Recreio",
    avatar: 8,
    team: ["lautaro-martinez-tazzo", "alexis-mac-allister-tazzo", "lisandro-martinez-tazzo"],
    goalkeeper: "goleiro-brasil-alison",
    collection: ["goleiro-brasil-alison", "lautaro-martinez-tazzo", "alexis-mac-allister-tazzo", "lisandro-martinez-tazzo", "danilo-tazzo", "wendell-tazzo"],
    wants: ["marquinhos-tazzo", "raphinha-tazzo", "gabriel-martinelli-tazzo"]
  }
];

const BATTLE_MODES = {
  casual: { name: "Casual", meta: "8 min / 30s", matchTime: 480, actionTime: 30 },
  training: { name: "Treino", meta: "8 min / 30s", matchTime: 480, actionTime: 30 },
  friend: { name: "Amigo", meta: "6 min / 20s", matchTime: 360, actionTime: 20 },
  ranked: { name: "Ranqueada", meta: "6 min / 20s", matchTime: 360, actionTime: 20 },
  tournament: { name: "Torneio", meta: "5 min / 15s", matchTime: 300, actionTime: 15 }
};

const BATTLE_FORMATIONS = {
  center: {
    name: "Centro",
    meta: "Trio alinhado",
    positions: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]
  },
  wall: {
    name: "Muralha",
    meta: "Dois na frente",
    positions: [{ x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 3 }]
  },
  spread: {
    name: "Aberta",
    meta: "Controle largo",
    positions: [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 0, y: 4 }]
  }
};

const BATTLE_OPPONENTS = [
  { id: "random", mode: "casual", name: "IA surpresa", meta: "Time sorteado", team: null, goalkeeper: null },
  { id: "tampinha", mode: "casual", name: "Liga Tampinha", meta: "Basico equilibrado", team: ["richarlison-tazzo", "joao-gomes-tazzo", "danilo-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { id: "crocante", mode: "casual", name: "Liga Crocante", meta: "Chute e colisao", team: ["rodrygo-tazzo", "casemiro-tazzo", "bremer-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { id: "holo", mode: "casual", name: "Desafio Holo", meta: "Equipe veloz", team: ["vinicius-jr-tazzo", "raphinha-tazzo", "gabriel-magalhaes-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { id: "edge", mode: "training", name: "Treino de borda", meta: "Empurroes e risco", team: ["bremer-tazzo", "gabriel-magalhaes-tazzo", "cristian-romero-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { id: "speed", mode: "training", name: "Treino veloz", meta: "Chutes longos", team: ["vinicius-jr-tazzo", "rodrygo-tazzo", "gabriel-martinelli-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { id: "keepers", mode: "training", name: "Treino de goleiros", meta: "Habilidades unicas", team: ["artilheiro-brasil", "lucas-paqueta-tazzo", "marquinhos-tazzo"], goalkeeper: "goleiro-brasil-alison" }
];

const TOURNAMENT_OPPONENTS = {
  daily: { name: "Chave Diario", team: ["richarlison-tazzo", "joao-gomes-tazzo", "bremer-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  weekly: { name: "Final Semanal", team: ["vinicius-jr-tazzo", "lucas-paqueta-tazzo", "marquinhos-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  event: { name: "Mascote Monstronho", team: ["endrick-tazzo", "angel-di-maria-tazzo", "cristian-romero-tazzo"], goalkeeper: "goleiro-brasil-alison" }
};

const RANKED_OPPONENTS = [
  { rank: "Tampinha", name: "Rival Tampinha", team: ["danilo-tazzo", "andreas-pereira-tazzo", "alex-sandro-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { rank: "Recreio", name: "Colecionador Recreio", team: ["richarlison-tazzo", "bruno-guimaraes-tazzo", "wendell-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { rank: "Crocante", name: "Capitao Crocante", team: ["julian-alvarez-tazzo", "enzo-fernandez-tazzo", "bremer-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { rank: "Holografico", name: "Bia Holografica", team: ["lautaro-martinez-tazzo", "alexis-mac-allister-tazzo", "lisandro-martinez-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { rank: "Lendario", name: "Nina Lendaria", team: ["vinicius-jr-tazzo", "lucas-paqueta-tazzo", "gabriel-magalhaes-tazzo"], goalkeeper: "goleiro-brasil-alison" },
  { rank: "Mestre dos Tazzos", name: "Mestre Kick Tazzos", team: ["artilheiro-brasil", "angel-di-maria-tazzo", "cristian-romero-tazzo"], goalkeeper: "goleiro-brasil-alison" }
];

const TUTORIAL_STEPS = [
  {
    id: "pack",
    title: "Primeiro pacotinho",
    description: "Abra um pacotinho para sentir o loop principal: comprar, rasgar, revelar e guardar os tazzos.",
    action: "Abrir pacotinhos",
    steps: ["Clique em Abrir pacotinhos.", "Compre um pacote simples.", "Rasgue a embalagem e revele os discos."],
    tip: "Pacotes simples sao baratos e bons para entender novos, repetidos e fragmentos.",
    completes: "Conclui quando voce abre qualquer pacotinho."
  },
  {
    id: "collection",
    title: "Abrir album",
    description: "Entre na colecao para ver obtidos, faltantes, raridades e copias repetidas.",
    action: "Ver colecao",
    steps: ["Abra a Colecao.", "Compare os tazzos coloridos com os faltantes.", "Use filtros para achar repetidos ou uma raridade."],
    tip: "O album e onde voce decide quem entra no trio, quem vira troca e quem vale melhorar.",
    completes: "Conclui quando voce entra na aba Colecao."
  },
  {
    id: "inspect",
    title: "Ver atributos",
    description: "Clique na arte de qualquer tazzo para abrir o popup com chute, drible, velocidade e vitalidade.",
    action: "Inspecionar tazzo",
    steps: ["Abra a Colecao.", "Clique na imagem de um tazzo obtido.", "Leia os atributos e a funcao dele."],
    tip: "Chute atinge em linha e causa metade do valor. Drible e adjacente e usa o valor inteiro.",
    completes: "Conclui quando o popup de um tazzo abre."
  },
  {
    id: "team",
    title: "Montar trio",
    description: "Escolha tres jogadores de campo e um goleiro. Goleiros ficam fora do campo e viram habilidade unica.",
    action: "Montar time",
    steps: ["Escolha um slot do trio.", "Clique em Colocar no slot em um jogador de campo.", "Escolha um goleiro ativo na colecao."],
    tip: "Um time equilibrado costuma ter atacante, meia e zagueiro para aproveitar os bonus de zona.",
    completes: "Conclui quando voce troca um jogador do trio ou escolhe um goleiro."
  },
  {
    id: "position",
    title: "Posicionar na arena",
    description: "Ajuste a formacao ou clique nas casas da zona inicial antes de iniciar a partida.",
    action: "Preparar batalha",
    steps: ["Volte para Batalha.", "Escolha uma formacao ou clique nas casas da esquerda.", "Comece a batalha quando os 3 estiverem posicionados."],
    tip: "Zagueiros gostam da sua area, meias do centro, atacantes do campo inimigo.",
    completes: "Conclui quando voce muda formacao ou posiciona um tazzo."
  },
  {
    id: "shot",
    title: "Chutar",
    description: "Use Chutar em linha reta para avancar e causar metade do valor de chute como dano.",
    action: "Treinar chute",
    steps: ["O cenario ja deixa um rival em linha reta.", "Clique em Chutar.", "Escolha o alvo destacado no campo."],
    tip: "Chute causa 50% do atributo. Com a habilidade dos Hermanos, o proximo chute usa o valor cheio.",
    completes: "Conclui quando voce acerta um Chute."
  },
  {
    id: "dribble",
    title: "Driblar",
    description: "Use Driblar contra um inimigo adjacente. O dano usa o valor cheio de drible.",
    action: "Treinar drible",
    steps: ["O cenario ja comeca com o rival colado em voce.", "Clique em Driblar.", "Escolha o inimigo adjacente destacado."],
    tip: "Drible e forte de perto. Atacante causa 1.25x contra Meia, Meia contra Zagueiro, Zagueiro contra Atacante.",
    completes: "Conclui quando voce causa dano com Driblar."
  },
  {
    id: "pressure",
    title: "Pressionar",
    description: "Use Pressionar em um inimigo adjacente para empurrar sem dano direto.",
    action: "Treinar pressao",
    steps: ["O cenario deixa um rival adjacente.", "Clique em Pressionar.", "Escolha o alvo para empurrar uma casa."],
    tip: "Pressionar nao da dano direto, mas prepara borda, colisao e controle de espaco.",
    completes: "Conclui quando voce pressiona um inimigo."
  },
  {
    id: "collision",
    title: "Causar colisao",
    description: "Empurre um inimigo contra borda ou outro tazzo para causar dano extra de colisao.",
    action: "Treino de borda",
    steps: ["O cenario coloca o rival na borda.", "Clique em Pressionar.", "Empurre o alvo para fora da arena."],
    tip: "Colisao causa dano extra. Borda causa dano e o tazzo volta para a ultima casa valida.",
    completes: "Conclui quando um empurrao gera borda ou colisao."
  },
  {
    id: "retreat",
    title: "Recuar",
    description: "Use Recuar quando estiver marcado por inimigo e quiser escapar do contato.",
    action: "Treinar recuo",
    steps: ["O cenario comeca com seu tazzo marcado.", "Clique em Recuar.", "Escolha uma casa que saia da marcacao."],
    tip: "Quando voce esta colado em inimigo, Mover mantem contato. Recuar e a fuga segura.",
    completes: "Conclui quando voce escapa usando Recuar."
  },
  {
    id: "move",
    title: "Mover na arena",
    description: "Selecione Mover e escolha uma casa brilhando para reposicionar o tazzo ativo.",
    action: "Treinar movimento",
    steps: ["O cenario comeca sem contato direto.", "Clique em Mover.", "Clique numa casa destacada para ganhar posicao."],
    tip: "Mover prepara dribles, chutes em linha e bonus de zona. Velocidade maior abre mais casas.",
    completes: "Conclui quando um tazzo seu se move."
  },
  {
    id: "swap",
    title: "Trocar posicao",
    description: "Use Trocar para inverter a casa do tazzo ativo com um aliado.",
    action: "Treinar troca",
    steps: ["O cenario deixa um aliado ao seu lado.", "Clique em Trocar.", "Escolha o aliado destacado."],
    tip: "Trocar salva tazzos em perigo e prepara novas linhas de chute sem gastar movimento longo.",
    completes: "Conclui quando dois aliados trocam de lugar."
  },
  {
    id: "keeper",
    title: "Usar goleiro",
    description: "Use a habilidade do goleiro uma vez por partida para virar o ritmo do turno.",
    action: "Usar goleiro",
    steps: ["O cenario ja vem com goleiro pronto.", "No seu turno, clique em Goleiro.", "Observe o efeito criado pela habilidade."],
    tip: "Allishow da turno extra para a mesma unidade: use a habilidade, faca uma acao, e jogue de novo.",
    completes: "Conclui quando voce usa a habilidade de goleiro."
  },
  {
    id: "pass",
    title: "Passar turno",
    description: "Use Passar quando nenhuma jogada melhora sua posicao ou quando voce quer preservar a formacao.",
    action: "Treinar passe",
    steps: ["O cenario nao exige alvo.", "Clique em Passar.", "Veja o turno encerrar sem gastar outra acao."],
    tip: "Passar e raro, mas evita movimentos ruins quando o melhor plano e esperar o rival se expor.",
    completes: "Conclui quando voce passa o turno."
  },
  {
    id: "win",
    title: "Vencer batalha",
    description: "Derrube os tres tazzos do rival, ou venca no tempo por vivos, vitalidade e dano causado.",
    action: "Ir para batalha",
    steps: ["Mantenha tazzos vivos.", "Use vantagem de funcao e bonus de zona.", "Finalize alvos com pouca vitalidade."],
    tip: "Se o tempo acabar, vivos decidem primeiro. Depois vem vitalidade total e dano causado.",
    completes: "Conclui quando voce vence uma partida."
  },
  {
    id: "trade",
    title: "Conhecer trocas",
    description: "Veja como as propostas funcionam sem precisar ter amigos jogando agora.",
    action: "Ver trocas",
    steps: ["Abra Trocas.", "Veja onde ficam amigos, oferta, pedido e lista de desejo.", "Volte quando tiver amigos ou repetidos suficientes."],
    tip: "Trocas sao opcionais. Elas ficam melhores quando voce tem duplicatas e amigos ativos.",
    completes: "Conclui quando voce abre a aba Trocas."
  },
  {
    id: "clash",
    title: "Conhecer bater tazzos",
    description: "Veja onde fica o duelo de bater tazzos, sem precisar convidar alguem durante o tutorial.",
    action: "Ver bater tazzos",
    steps: ["Abra Online.", "Veja o painel Bater Tazzos.", "Quando quiser jogar, convide um amigo; se ele aceitar, voces escolhem tazzos de valores iguais e batem na mesa."],
    tip: "Bater tazzos e opcional e social. O tutorial so apresenta a area e a regra geral.",
    completes: "Conclui quando voce abre a aba Online."
  },
  {
    id: "tournament",
    title: "Conhecer torneios",
    description: "Veja onde ficam os torneios, entradas, premios e adversarios sem iniciar uma partida agora.",
    action: "Ver torneios",
    steps: ["Abra Torneios.", "Veja as entradas, premios e adversarios.", "Volte quando quiser disputar uma chave de verdade."],
    tip: "Torneios continuam opcionais no tutorial. Voce so precisa conhecer onde eles ficam.",
    completes: "Conclui quando voce abre a area de Torneios."
  },
  {
    id: "ranked",
    title: "Conhecer ranqueada",
    description: "Veja a liga competitiva e o matchmaking sem precisar entrar na fila durante o tutorial.",
    action: "Ver liga",
    steps: ["Abra Torneios.", "Confira custo do time, divisao e chance estimada.", "Quando o trio estiver pronto, dispute ranqueada fora do tutorial."],
    tip: "Ranqueada usa limite de custo. O tutorial apenas mostra a porta de entrada.",
    completes: "Conclui quando voce abre a area competitiva."
  }
];

function mon(id, assetNumber, name, types, rarity, vitality, shot, dribble, speed, role, keeperAbility = null, shirtNumber = null) {
  return {
    id,
    number: assetNumber,
    shirtNumber,
    name,
    types,
    rarity,
    vitality,
    shot,
    dribble,
    speed,
    role,
    keeperAbility,
    image: ASSETS[assetNumber - 1],
    backImage: DEFAULT_BACK_IMAGE,
    cost: RARITIES[rarity].cost
  };
}

function player(id, number, name, image, types, rarity, vitality, shot, dribble, speed, role) {
  return {
    id,
    number,
    shirtNumber: null,
    name,
    types,
    rarity,
    vitality,
    shot,
    dribble,
    speed,
    role,
    keeperAbility: null,
    image,
    backImage: DEFAULT_BACK_IMAGE,
    cost: RARITIES[rarity].cost
  };
}

function keeperCard(id, number, image, name, rarity, keeperAbility) {
  return {
    id,
    number,
    shirtNumber: null,
    name,
    types: ["Goleiro"],
    rarity,
    vitality: 0,
    shot: 0,
    dribble: 0,
    speed: 0,
    role: "Goleiro",
    keeperAbility,
    image,
    backImage: DEFAULT_BACK_IMAGE,
    cost: RARITIES[rarity].cost
  };
}

function goalie(id, assetNumber, name, rarity, keeperAbility) {
  return {
    id,
    number: assetNumber,
    shirtNumber: null,
    name,
    types: ["Goleiro"],
    rarity,
    vitality: 0,
    shot: 0,
    dribble: 0,
    speed: 0,
    role: "Goleiro",
    keeperAbility,
    image: ASSETS[assetNumber - 1],
    backImage: DEFAULT_BACK_IMAGE,
    cost: RARITIES[rarity].cost
  };
}

window.TAZZOMON_DATA = {
  ASSETS,
  BACKS,
  DEFAULT_BACK_IMAGE,
  TYPES,
  RARITIES,
  TAZZO_TRADE_VALUES,
  MONSTERS,
  MONSTER_BY_ID,
  RANKS,
  TOURNAMENTS,
  SHOP_ITEMS,
  PACKS,
  MISSIONS,
  ECONOMY_REWARD_RULES,
  SOCIAL_SHARE_REWARDS,
  FRIENDS,
  BATTLE_MODES,
  BATTLE_FORMATIONS,
  BATTLE_OPPONENTS,
  TOURNAMENT_OPPONENTS,
  RANKED_OPPONENTS,
  TUTORIAL_STEPS
};
})();
