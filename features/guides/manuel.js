/* Manuel de l'utilisateur (Guides › Manuel d'utilisation) : texte seulement, à tenir à jour quand une fonction change. */
const MANUEL = [
  [
    "Premiers pas",
    `<p>Le Carnet de l'Éducateur est une bibliothèque de jeux d'escalade (et d'exercices de préparation physique) pour les éducateurs sportifs, avec un outil pour <b>composer ses séances</b> et les imprimer.</p>
    <ul><li><b>Le menu de gauche</b> (le bouton ☰ sur téléphone) donne accès à tout : les jeux, vos séances, les guides.</li>
    <li><b>Sans compte</b>, vous pouvez parcourir les jeux, lire les guides, composer une séance et l'exporter. <b>Avec un compte Google</b>, vous pouvez en plus enregistrer vos séances, les retrouver sur tous vos appareils et les partager.</li>
    <li>Le site marche aussi <b>hors connexion</b> (voir plus bas).</li></ul>`,
  ],
  [
    "Trouver un jeu",
    `<ul><li><b>Tous les jeux</b> : le catalogue complet, avec une recherche et des filtres (intensité, matériel…). Deux présentations : <i>Galerie</i> (cartes) et <i>Liste</i> (tableau).</li>
    <li><b>Les familles</b> (Exploration, Coopération, Défis, Animation) et les entrées de <b>Parcourir</b> (compétences, objectifs, « sans expérience », « sans matériel ») filtrent la liste.</li>
    <li>Cliquez sur un jeu pour ouvrir sa <b>fiche</b> : principe, variantes, pratique, conseils et schéma. Quand un jeu n'a pas de schéma, le logo du site le remplace.</li>
    <li>L'<b>étoile</b> ☆ ajoute un jeu à <b>Mes favoris</b>.</li></ul>`,
  ],
  [
    "Composer une séance",
    `<p>Menu <b>Créer une séance</b>. La page est organisée en onglets : <b>Informations</b>, <b>Échauffement</b>, <b>Corps de séance</b>, <b>Bas de fiche</b>, <b>Contrôle et bilan</b> et <b>Aperçu</b>. Une frise colorée en haut résume la séance et les durées.</p>
    <ul><li><b>Informations</b> : titre, public, éducateurs, dates, sécurité, et surtout les <b>groupes</b> (de 1 à 4). Chaque groupe a un nom, un temps d'accueil et une couleur qu'il garde toujours. On les réordonne en glissant la poignée ⠿ (ou avec les flèches ↑ ↓).</li>
    <li><b>Échauffement et corps de séance</b> sont faits d'<b>exercices seuls</b> (bleu-vert) et de <b>blocs</b> (violet). Un <b>exercice seul</b> est un jeu ou un exercice libre sur sa propre ligne. Un <b>bloc</b> regroupe plusieurs petits exercices sous un titre. Le bouton « → Exercice seul » transforme un bloc d'un seul exercice en exercice seul, « → Bloc » fait l'inverse.</li>
    <li><b>Ajouter</b> : « 🔍 Exercice de la bibliothèque » cherche dans les jeux du site ; « ✎ Exercice libre » permet d'écrire le sien ; « ＋ Bloc » crée un bloc.</li>
    <li>Chaque carte se <b>plie et se déplie</b> d'un clic sur son bandeau (« Tout déplier » / « Tout replier » en haut). Le bandeau replié montre les groupes concernés et leur durée. Cliquer sur le <b>code ou le nom</b> d'un jeu ouvre sa fiche en lecture seule, sans quitter la séance.</li>
    <li><b>Pour</b> : cochez les groupes qui font l'exercice et réglez la durée de chacun. La durée d'un groupe décoché est grisée.</li>
    <li><b>Ordre</b> : glissez la poignée ⠿ d'une carte, ou utilisez les flèches ↑ ↓ (pratiques au téléphone). Les exercices seuls et les blocs sont numérotés selon leur place ; l'échauffement n'est pas numéroté.</li>
    <li><b>Contrôle et bilan</b> compare la durée prévue de chaque groupe à la durée totale de la séance.</li>
    <li>Tout est <b>enregistré automatiquement dans le navigateur</b> pendant que vous travaillez. Le bouton « Effacer le contenu de la page » repart de zéro.</li></ul>`,
  ],
  [
    "Fiche, Word, PDF et impression",
    `<ul><li>Dans <b>Informations</b>, choisissez le <b>modèle</b> : <i>Simplifiée</i> (un déroulé court, lisible d'un coup d'œil) ou <i>Complète</i> (fiche détaillée), et l'emplacement des <b>schémas</b> (aucun, sous chaque exercice, ou sur une page à part). Par défaut : modèle simplifié, sans schéma.</li>
    <li>L'onglet <b>Aperçu</b> montre la fiche telle qu'elle sera imprimée. Les boutons permettent de l'<b>imprimer ou l'enregistrer en PDF</b>, de la télécharger en <b>Word</b> (modifiable) ou de <b>copier le texte</b>.</li>
    <li>Ces exports ne demandent <b>pas de compte</b>.</li>
    <li>Le bouton « Ajouter le logo de la salle » place votre logo en haut de la fiche.</li></ul>`,
  ],
  [
    "Enregistrer, retrouver et partager",
    `<ul><li>Pour <b>enregistrer</b> une séance dans votre bibliothèque, connectez-vous avec Google (menu « Se connecter »), puis cliquez sur « Enregistrer ».</li>
    <li><b>Séances et cycles</b> liste vos séances et celles qui sont partagées avec vous. Une séance peut être ouverte, modifiée, dupliquée (« copie ») ou supprimée.</li>
    <li>Une séance peut être <b>envoyée par e-mail</b> ou partagée avec une <b>équipe</b> (menu Mon compte › Équipes) pour que plusieurs éducateurs travaillent sur les mêmes fiches.</li>
    <li><b>Créer un cycle</b> assemble plusieurs séances en un programme.</li></ul>`,
  ],
  [
    "Mode terrain",
    `<p>Depuis une séance enregistrée, le bouton <b>Terrain</b> ouvre une version pensée pour la salle : écran plein, étapes dans l'ordre (accueil, échauffement, corps de séance, retour au calme, bilan), chronomètre et notes. Le chronomètre tourne bien en arrière-plan, mais <b>il ne sonne que si l'écran est allumé</b> : laissez l'écran actif pendant la séance.</p>`,
  ],
  [
    "Proposer un jeu, un schéma ou un retour",
    `<ul><li><b>+ Proposer un jeu</b> (menu de gauche) : remplissez le formulaire ; le jeu est relu par l'administrateur avant publication. Si vous êtes connecté, vous êtes prévenu par e-mail quand il est publié.</li>
    <li>Vous pouvez joindre un <b>schéma</b> : dessiné avec l'éditeur (<i>Dessiner un schéma</i>), ou une <b>photo ou image</b> prise sur votre appareil (elle est réduite automatiquement avant l'envoi).</li>
    <li>Sur la fiche d'un jeu, vous pouvez aussi laisser un <b>retour de terrain</b> (ce qui a bien ou mal marché).</li></ul>`,
  ],
  [
    "Utiliser hors connexion",
    `<p>Les fiches de jeux, les guides et le mode terrain sont gardés dès la première visite. Pour avoir aussi les <b>schémas</b> en salle sans réseau, ouvrez <b>Utiliser hors connexion</b> et gardez ceux de votre séance ou de vos favoris. Les séances déjà ouvertes restent consultables.</p>`,
  ],
  [
    "Les guides",
    `<ul><li><b>Règles de sécurité</b> : les repères à rappeler avant de lancer un jeu.</li>
    <li><b>Organiser ses séances</b> : <i>Initiation au bloc</i> (démarrer avec des débutants), <i>Séance type</i> (une séance de référence à consulter et copier) et <i>Compétences travaillées</i> (les jeux par compétence, mis à jour automatiquement quand un jeu est ajouté).</li>
    <li><b>Former les équipes</b> : des façons rapides de répartir un groupe.</li>
    <li><b>Glossaire</b> : les mots utilisés dans les fiches, par ordre alphabétique, avec une recherche.</li></ul>`,
  ],
  [
    "Questions fréquentes",
    `<ul><li><b>Ma séance a disparu.</b> Une séance non enregistrée n'existe que dans le navigateur où vous l'avez créée. Connectez-vous et enregistrez-la pour la retrouver partout.</li>
    <li><b>Le chronomètre ne sonne pas.</b> L'écran doit rester allumé (voir « Mode terrain »).</li>
    <li><b>Je ne vois pas un jeu que je viens de proposer.</b> Il doit d'abord être relu et publié ; la mise à jour du site prend environ une minute.</li>
    <li><b>Un schéma ne s'affiche pas.</b> Vérifiez votre connexion, ou gardez-le hors connexion avant d'aller en salle.</li>
    <li><b>Un mot m'est inconnu.</b> Consultez le Glossaire (menu Guides).</li></ul>`,
  ],
];
function manuelView() {
  return `<h2 class="pt">Manuel d'utilisation</h2><p class="lead">Tout ce qu'il faut savoir pour utiliser le site, en quelques minutes. Cliquez sur une rubrique pour la déplier.</p>
  <div class="tools noprint"><a class="chip" data-man="open" style="cursor:pointer">Tout déplier</a><a class="chip" data-man="close" style="cursor:pointer">Tout replier</a></div>
  ${MANUEL.map(([t, h], i) => `<details class="box man"${i === 0 ? " open" : ""}><summary><b>${i + 1}. ${t}</b></summary><div class="man-b">${h}</div></details>`).join("")}`;
}
registerClick(e => {
  const b = e.target.closest("[data-man]");
  if (!b) return;
  document.querySelectorAll("details.man").forEach(d => (d.open = b.dataset.man === "open"));
  return true;
});
