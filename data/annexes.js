/* Contenus des guides (séances types, glossaire, compétences…). */
const AX = {
  SECU: [
    [
      "Hauteur maximale",
      "Pour les jeux, on reste en hauteur de bloc, bien en dessous de la hauteur habituelle. Repère conseillé : pieds à moins de 1,5 m, et 1 m pour les jeux yeux bandés ou avec contacts. À valider avec le règlement de votre salle.",
    ],
    [
      "Tapis",
      "Tapis bien jointifs, sans trou ni objet dessus. Les sacs, bouteilles et chaussures restent hors de la zone de réception.",
    ],
    [
      "Désescalade, jamais de saut",
      "On redescend en contrôlant, face au mur. Le saut est interdit, sauf règle explicite à très faible hauteur ; réception sur deux pieds, genoux fléchis.",
    ],
    [
      "Ballons en mousse",
      "Ballons ultra-légers uniquement. On vise le corps, jamais la tête, et on ne tire pas sur un grimpeur en train de se déplacer en hauteur.",
    ],
    [
      "Bandeau",
      "Réservé à la faible hauteur, avec un guide présent en permanence. Un enfant qui n'aime pas avoir les yeux bandés peut simplement fermer les yeux, ou refuser.",
    ],
    [
      "Signal d'arrêt",
      "Un seul signal (sifflet ou mot « stop »), répété avant le premier jeu : tout le monde s'arrête et descend. On l'entraîne à blanc.",
    ],
    [
      "Pareur",
      "Dans les jeux avec contacts ou déplacements rapides, un adulte ou un enfant formé se place sous le grimpeur pour guider la réception et protéger la tête. Il n'attrape pas.",
    ],
    [
      "Comportement et équipement",
      "Interdit de pousser, tirer ou s'accrocher à un autre grimpeur. Cheveux attachés, pas de bijoux, poches vides. Un seul grimpeur par prise sauf règle contraire.",
    ],
  ],
  GLOSS: [
    ["Amplitude", "Écart maximal entre deux appuis : plus il est grand, plus le geste est ample."],
    ["Appui", "Toute prise ou volume sur lequel on pose un pied ou une main."],
    ["Bloc", "Itinéraire court, à faible hauteur, grimpé sans corde au-dessus de tapis."],
    [
      "Bassin",
      "Le centre du corps : son placement détermine l'équilibre et le transfert de poids.",
    ],
    [
      "Dégaine",
      "Deux mousquetons reliés par une sangle courte, qui sert ici de jeton ou d'objet à transporter.",
    ],
    ["Désescalade", "Redescendre le mur en grimpant, sans sauter."],
    [
      "Embut",
      "Zone de départ ou d'arrivée d'une équipe, derrière laquelle elle attend (jeu du béret).",
    ],
    ["Manche", "Une partie complète du jeu, avant d'inverser les rôles ou les équipes."],
    ["Pan", "Une portion de mur, d'un seul tenant, d'une même inclinaison."],
    ["Pareur", "Personne placée sous le grimpeur pour guider sa réception et protéger sa tête."],
    ["Pied de mur", "La base du mur, au niveau du tapis."],
    ["Plafond", "Partie horizontale ou très inclinée au-dessus de la tête du grimpeur."],
    ["Prise", "Élément coloré fixé au mur, qui sert d'appui pour les mains ou les pieds."],
    ["Prise-cible", "Prise désignée comme but à toucher (pas de géant, chenille)."],
    ["Relais", "Passage de témoin : le suivant ne part que lorsque le précédent a fini."],
    ["Sangle", "Bande de tissu qui sert ici de lien entre deux grimpeurs (cordée) ou d'ancrage."],
    ["Témoin", "Objet que l'on transmet au coéquipier suivant, ou simple touche de la main."],
    ["Traversée", "Déplacement horizontal le long du mur, sans monter."],
    [
      "Via ferrata",
      "Ici : parcours en traversée équipé d'une cordelette le long de laquelle on fait glisser une dégaine.",
    ],
  ],
  EQUIPES: [
    [
      "Les foulards",
      "Chacun tire un foulard dans un sac sans regarder : chaque couleur forme une équipe. Rapide et aléatoire.",
    ],
    ["Les mois", "Naissance de janvier à juin d'un côté, de juillet à décembre de l'autre."],
    [
      "Par taille puis 1-2",
      "Le groupe se range par ordre de taille, puis on compte « 1, 2, 1, 2 » : les deux équipes sont équilibrées en taille.",
    ],
    ["Pair ou impair", "Chacun lance un dé ou tire une carte : pair d'un côté, impair de l'autre."],
    [
      "Les prises",
      "Au signal, chacun touche une prise d'une couleur imposée (deux couleurs) : la couleur choisie donne l'équipe.",
    ],
    [
      "Les listes",
      "L'éducateur répartit en alternant les plus expérimentés et les débutants, sans que cela se voie.",
    ],
  ],
  EQ_RULES: [
    "Équipes à effectifs égaux ; sinon un « joker » joue pour les deux équipes.",
    "Équilibrer le niveau, la taille et l'âge, surtout dans les jeux de vitesse.",
    "Changer les équipes d'une manche à l'autre pour que tous jouent avec tous.",
    "Éviter les capitaines qui choisissent à tour de rôle : le dernier choisi est blessé.",
  ],
  EQ_SIZES: [
    ["Binômes", "E4 · C3 · D11 · D10"],
    ["Équipes de 3", "D6 · C10"],
    ["2 équipes", "C4 · C9 · C11 · D1 · D2 · D3 · D4 · D5 · D7 · D9 · G2 · G3"],
    ["Un loup contre tous", "C2 · E9"],
  ],
  FAMDESC: {
    Exploration:
      "Explorer le mur avec une contrainte de déplacement : prises imposées, matériel à éviter, handicap volontaire. On y travaille la lecture du mur et la précision des appuis.",
    Coopération:
      "Réussir ensemble : guidage, encordement, dépassement, poursuite et efforts collectifs. La communication compte autant que la technique.",
    Défis:
      "Se mesurer en vitesse, en score ou en duel, seul ou par équipes. Idéal pour dynamiser une séance ; penser à équilibrer les équipes.",
    Animation:
      "Jeux menés par l'éducateur : consignes, mémoire, dés, grille. Parfaits pour les anniversaires et les groupes de débutants (6 à 11 ans, 6 à 12 enfants).",
  },
};
