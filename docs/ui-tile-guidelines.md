# Aetherium — Titres des tuiles illustrées

Règle de design pour l’accueil des Épreuves : difficulté, mini-jeux et aventures utilisent les mêmes tokens CSS dans `src/trial-viewport.css`.

- Georgia, graisse 600, ivoire chaud, casse naturelle, interligne 1,15.
- Taille unique pour un écran donné : 13–16 px sur grand écran, 11–14 px sur mobile, 11 px en paysage compact. Jamais de taille liée à la largeur d’une tuile ou à son rang dans une grille.
- Un titre centré horizontalement et verticalement ; retour à la ligne autorisé pour les noms longs. Léger fond translucide et ombre commune pour la lisibilité.
- Les difficultés conservent leur emblème au-dessus du titre (à côté en paysage compact), leur état de sélection et la mention À venir pour Ascension. Les aventures et mini-jeux n’affichent pas de bouton d’action redondant sur leur illustration : la tuile est le contrôle.
- Les informations secondaires des aventures sont conservées dans les libellés accessibles et les infobulles, et détaillées dans les écrans correspondants.
- Ne pas modifier les dimensions des grilles pour ajouter du texte. Garder les images, la fresque continue et l’accueil sans défilement.
