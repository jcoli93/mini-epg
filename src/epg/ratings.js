'use strict';
// ClassInd — Classificação Indicativa (Brazilian Ministry of Justice age ratings).
// L = Livre (all ages). The number is the minimum recommended age.
const RATINGS = ['L', '10', '12', '14', '16', '18'];

const LABELS = {
  L: 'Livre para todos os públicos',
  10: 'Não recomendado para menores de 10 anos',
  12: 'Não recomendado para menores de 12 anos',
  14: 'Não recomendado para menores de 14 anos',
  16: 'Não recomendado para menores de 16 anos',
  18: 'Não recomendado para menores de 18 anos',
};

function minimumAge(rating) {
  if (rating === 'L') return 0;
  const age = Number(rating);
  return RATINGS.includes(String(rating)) ? age : null;
}

function label(rating) {
  return LABELS[rating] || 'Classificação desconhecida';
}

module.exports = { RATINGS, minimumAge, label };
