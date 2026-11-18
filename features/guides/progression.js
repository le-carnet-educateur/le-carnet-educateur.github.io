/* Guide « Progression du 1er cycle » : document pédagogique pour faire progresser des débutants sur 8 séances (texte seulement) */
const CYCLE1 = {
  seances: [
    ["1. Chuter et descendre", "Tomber sans se blesser, désescalader, connaître les zones et la hauteur limite", "Genoux fléchis à la réception, amorti ou roulade sur les tapis ; désescalade maîtrisée depuis la hauteur limite ; ne passe pas sous un grimpeur", "Réception jambes tendues, bras tendus vers le sol, sauter de trop haut", "Chute progressive : d'abord depuis une prise basse, puis plus haut ; « atterris comme un chat » ; fixer la hauteur maximale (main au-dessus de la tête)"],
    ["2. S'équilibrer et se déplacer", "Garder son bassin au-dessus des appuis, traverser en sécurité", "Tient 3 s sur un pied ; traverse au ras du sol sans s'arrêter, bras plutôt tendus", "Coller au mur, hanches en arrière", "« Regarde tes pieds, pousse avec la jambe » ; prises de pieds plus grandes ; rappeler : un seul grimpeur par voie"],
    ["3. Poser les pieds", "Poser le pied avec précision, sans bruit", "Pied posé sur la pointe, sans regarder ensuite ; peu de re-poses", "Pieds à plat, « frotter » la prise", "Jeu du silence ; demander de désigner l'appui avant de poser"],
    ["4. Transférer le poids", "Passer le poids du corps d'un pied à l'autre", "Le bassin se déplace au-dessus du pied d'appui avant de lever l'autre pied", "Tirer sur les bras pour monter", "Exercice « bras tendus uniquement » sur une traversée"],
    ["5. Pousser avec les jambes", "Monter en s'aidant des jambes plutôt que des bras", "Bras plutôt tendus, pas de grimace d'effort ; monte plus haut qu'en séance 2", "Rester accroché aux bras entre deux mouvements", "Marquer des pauses bras tendus ; compter les mouvements de pied par mouvement de main"],
    ["6. Lire l'itinéraire", "Observer avant de grimper, choisir ses prises", "Regarde 10 s avant de partir ; verbalise le début de son parcours", "Partir sans réfléchir, se retrouver bloqué", "Temps d'observation imposé ; l'observateur annonce à voix haute la suite"],
    ["7. Parer et s'entraider", "Parer un camarade, tenir les rôles sociaux ; chute réinvestie à plus de hauteur", "Pareur attentif, bras prêts, ne regarde pas ailleurs ; chute toujours contrôlée", "Parer trop tard, se distraire", "Briefing et rôles tournants ; rappel du geste de réception de la séance 1"],
    ["8. Autonomie", "Enchaîner et s'auto-évaluer", "Choisit sa voie, la réalise, évalue sa difficulté ; applique seul les règles", "Surestimer son niveau", "Retour collectif en fin de séance : ce que j'ai réussi, ce que je veux travailler"],
  ],
  grille: ["Chuter et descendre en sécurité", "S'équilibrer, bassin au-dessus des appuis", "Poser les pieds avec précision", "Transférer le poids du corps", "Utiliser les jambes, économiser les bras", "Lire un itinéraire avant de grimper", "Parer, respecter les rôles"],
};
function progressionView() {
  const c = CYCLE1;
  return `<h2 class="pt">Progression du 1er cycle</h2>
  <p class="lead">Un premier cycle de 8 séances suffit à rendre un débutant autonome sur les gestes de base (chuter, se déplacer, s'équilibrer, grimper en sécurité) si chaque séance ne vise qu'<b>une seule compétence centrale</b> et la fait varier par le jeu.</p>
  <div class="tools noprint"><a class="chip" data-cyc="print" style="cursor:pointer">🖨 Imprimer</a></div>
  <div class="box"><b>Public et cadre</b><ul>
    <li>Débutants complets (enfants dès 8 ans, ados, adultes), en structure de bloc ou de pan, sur <b>8 séances de 1 h à 1 h 30</b>, une par semaine.</li>
    <li>Objectif : passer de « je grimpe en force et en tâtonnant » à « je me déplace de façon économe, je maîtrise la chute et la descente, je respecte les règles de sécurité ».</li>
    <li>Ce n'est pas un catalogue de jeux : chaque séance a une <b>intention pédagogique</b>, le jeu n'est que le moyen de la rencontrer.</li>
    <li>Groupe type : 6 à 12 pratiquants, 1 éducateur, hauteur de bloc limitée, tapis de réception en bon état.</li></ul></div>
  <div class="box"><b>Principes tirés de la littérature</b><ol>
    <li><b>Une compétence centrale par séance.</b> Le débutant sature vite : on travaille un seul apprentissage, les autres sont entretenus.</li>
    <li><b>Du connu au complexe, du bas vers le haut.</b> On commence près du sol (sécurité affective), puis on monte et on complexifie les itinéraires.</li>
    <li><b>Le jeu comme situation-problème.</b> Le but est clair, la règle crée la contrainte, l'élève cherche sa solution ; l'éducateur régule plutôt qu'il ne démontre.</li>
    <li><b>La chute en premier.</b> L'apprentissage de la chute, de la réception et de la descente est la séance 1 : tant qu'il n'est pas acquis, on ne monte pas plus haut. Les règles de circulation suivent dès la première séance.</li>
    <li><b>Rôles sociaux.</b> Grimpeur, observateur, pareur : chacun passe par tous les rôles, ce qui donne de l'autonomie et un regard sur la technique.</li></ol>
    <p><b>Fil conducteur :</b> chuter et descendre → s'équilibrer et se déplacer → poser les pieds → transférer le poids → utiliser les jambes → lire un itinéraire → parer et s'entraider → grimper en autonomie.</p></div>
  <h3>La progression en 8 séances</h3>
  <p>Pour chaque séance : la compétence centrale, ce que l'éducateur doit <b>voir</b> pour dire que c'est acquis, l'erreur la plus fréquente et la régulation à proposer. Les séances 7 et 8 sont une synthèse : on y réinvestit tout.</p>
  <div style="overflow-x:auto"><table class="tl"><thead><tr><th>Séance</th><th>Compétence centrale</th><th>Indicateurs observables</th><th>Erreur fréquente</th><th>Régulation de l'éducateur</th></tr></thead><tbody>${c.seances
    .map(r => `<tr>${r.map((x, i) => (i ? `<td>${esc(x)}</td>` : `<td><b>${esc(x)}</b></td>`)).join("")}</tr>`)
    .join("")}</tbody></table></div>
  <div class="box"><b>Structure type de chaque séance (60 à 90 min)</b><ol>
    <li>Accueil et rappel des règles de sécurité (5 min)</li>
    <li>Échauffement ludique, articulaire et cardio doux (10 min)</li>
    <li>Situation centrale liée à la compétence du jour, 2 à 3 variantes de difficulté croissante (30 à 45 min)</li>
    <li>Situation de réinvestissement : jeu libre ou parcours, la compétence est remise en jeu (15 min)</li>
    <li>Retour au calme et bilan oral : « qu'est-ce que j'ai appris ? » (5 min)</li></ol></div>
  <h3>Évaluation formative</h3>
  <p>À remplir en fin de séance 4 (mi-parcours) et de séance 8, au regard des indicateurs du tableau. Trois niveaux suffisent : <b>non acquis</b>, <b>en cours</b>, <b>acquis</b>. Le but est d'orienter la suite, pas de noter.</p>
  <div style="overflow-x:auto"><table class="tl"><thead><tr><th>Compétence</th><th>Séance 4</th><th>Séance 8</th></tr></thead><tbody>${c.grille.map(x => `<tr><td>${esc(x)}</td><td style="min-width:90px"></td><td style="min-width:90px"></td></tr>`).join("")}</tbody></table></div>
  <div class="box"><b>Sécurité, rôles et pièges à éviter</b>
    <p><b>Règles à poser dès la séance 1</b></p><ul>
    <li>Un seul grimpeur par zone ; on ne passe jamais sous quelqu'un qui grimpe.</li>
    <li>Hauteur maximale annoncée ; on redescend ou on saute contrôlé en dessous de la limite.</li>
    <li>Zone de réception dégagée (sacs, chaussures, spectateurs hors des tapis).</li>
    <li>Signal d'arrêt commun, connu de tous.</li></ul>
    <p><b>Rôles sociaux :</b> grimpeur, observateur (donne un retour sur un critère précis), pareur (à partir de la séance 7). Chacun les tient tous au moins une fois.</p>
    <p><b>À éviter dans un premier cycle</b></p><ul>
    <li>Enseigner trop de choses à la fois : une compétence par séance.</li>
    <li>Chercher la performance (hauteur, difficulté) avant la qualité du geste.</li>
    <li>Faire attendre : privilégier des situations où tout le monde grimpe ou observe activement.</li>
    <li>Corriger tout le monde en même temps : un seul conseil, ciblé, par grimpeur.</li>
    <li>Repousser l'apprentissage de la chute : c'est la base de la sécurité, et ce qui rassure et débloque la progression.</li></ul></div>
  <p style="font-size:12.5px;color:var(--muted)">Sources : Académie de Nice, <i>Jeux de grimpe, cycles 2-3</i> et <i>Escalade et EMC</i> · Ministère des Sports, PRNSN, <i>Savoir grimper</i> · Mobilesport / OFSPO, <i>Praxis 2010/71, escalade</i>. Le découpage en 8 séances, les indicateurs et les régulations sont une synthèse proposée à partir de ces ressources, à adapter à votre public.</p>`;
}
registerClick(e => {
  const b = e.target.closest("[data-cyc]");
  if (!b) return;
  window.print();
  return true;
});
