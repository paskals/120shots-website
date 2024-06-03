export const getRollSlug = (rollId) => {
  return rollId.split("/").pop();
};

export const sortShotsByDate = (a, b) => a.date - b.date;
export const getEarliestDate = (roll) => {
  const shots = roll.data.shots;
  const shortedShots = shots.sort(sortShotsByDate);
  return shortedShots[0].date;
};

export const sortRollsByDate = (a, b) =>
  getEarliestDate(a) - getEarliestDate(b);

export const filterHiddenShots = (shot) => !shot.hidden;

export const getDatesRange = (roll) => {
  const shots = roll.data.shots;
  const shortedShots = shots.sort(sortShotsByDate);
  return {
    first: shortedShots[0].date,
    last: shortedShots[shortedShots.length - 1].date,
  };
};

const formatDate = (date) => {
  const options = { year: "numeric", month: "long" };
  return date.toLocaleDateString(undefined, options);
};

export const getDatesRangeFormatted = (roll) => {
  const datesRange = getDatesRange(roll);
  const start = formatDate(datesRange.first);
  const end = formatDate(datesRange.last);
  return start == end
    ? start
    : `${formatDate(datesRange.first)} - ${formatDate(datesRange.last)}`;
};

export const getCoverImage = (roll) => {
  const shots = roll.data.shots.filter(filterHiddenShots);
  const coverSequence = roll.data.cover;
  if (coverSequence) {
    return shots.find((shot) => shot.sequence == coverSequence)?.image;
  }
  return shots[Math.floor(Math.random() * shots.length)].image;
};
