# Aetherium — Titres des tuiles illustrées

Règle de design pour l’accueil des Épreuves : difficulté, mini-jeux et aventures utilisent les mêmes tokens CSS dans `src/trial-viewport.css`.

- Georgia, graisse 600, ivoire chaud, casse naturelle, interligne 1,15.
- Taille unique pour un écran donné : 13–16 px sur grand écran, 11–14 px sur mobile, 11 px en paysage compact. Jamais de taille liée à la largeur d’une tuile ou à son rang dans une grille.
- Un titre centré horizontalement et verticalement ; retour à la ligne autorisé pour les noms longs. Léger fond translucide et ombre commune pour la lisibilité.
- Les difficultés et aventures utilisent des sceaux pixel art octogonaux au même format SVG 48 × 48, de même taille adaptative (`--tile-emblem-size`), centrés au-dessus du titre (à côté en paysage compact). Les difficultés conservent leur état de sélection et la mention À venir pour Ascension. Les aventures utilisent les épées croisées (violet), la boussole (or) et le circuit runique (cyan). Les aventures et mini-jeux n’affichent pas de bouton d’action redondant sur leur illustration : la tuile est le contrôle.
- Les informations secondaires des aventures sont conservées dans les libellés accessibles et les infobulles, et détaillées dans les écrans correspondants.
- Ne pas modifier les dimensions des grilles pour ajouter du texte. Garder les images, la fresque continue et l’accueil sans défilement.

## Fresque des mini-jeux

Le Sanctuaire conserve sa composition validée, dans une version de fond sans titres, sceaux ni ornements incrustés. Les cinq boutons restent indépendants et accessibles, avec le même style typographique et les mêmes dimensions de sceaux que les difficultés et aventures. Les cinq sceaux SVG représentent la rune, le livre, le cadenas, les outils de fouille et la potion. La grille reste de trois tuiles en haut et deux en bas, sans séparation graphique dans le fond. Les titres et sceaux restent visibles même si l’image ne charge pas.
