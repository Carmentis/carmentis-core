export const MaskManager = {
  getListFromRegex,
  applyMask,
  getVisibleText,
  getFullText
};

function getListFromRegex(str, regex, substitution) {
  const stringParts = (regex.exec(str) || []).slice(1);

  if(stringParts.join("") != str) {
    throw `the regular expression ${regex} does not capture all string parts`;
  }

  const substitutionParts =
    substitution.split(/(\$\d+)/)
    .map((s, i) => [ i & 1, s ])
    .filter(a => a[1]);

  if(
    substitutionParts.length != stringParts.length ||
    substitutionParts.some(([ shown, s ], i) => shown && s != "$" + (i + 1))
  ) {
    throw `invalid substitution string "${substitution}"`;
  }

  const list = [];
  let ptr = 0;

  substitutionParts.forEach(([ shown, s ], i) => {
    const newPtr = ptr + stringParts[i].length;

    if(!shown) {
      list.push([ ptr, newPtr, s ]);
    }
    ptr = newPtr;
  });

  return list;
}

function applyMask(str, list) {
  const visible = [],
        hidden = [];

  list.sort((a, b) => a[0] - b[0]);

  list.forEach(([ start, end, maskString ], i) => {
    const [ prevStart, prevEnd ] = i ? list[i - 1] : [ 0, 0 ];

    if(start < 0 || start >= str.length || end <= start) {
      throw `invalid interval [${[start, end]}]`;
    }
    if(start < prevEnd) {
      throw `overlapping intervals [${[prevStart, prevEnd]}] / [${[start, end]}]`;
    }

    const hiddenPart = str.slice(start, end);

    if(i && start == prevEnd) {
      visible[visible.length - 1] += maskString;
      hidden[hidden.length - 1] += hiddenPart;
    }
    else {
      visible.push(str.slice(prevEnd, start), maskString);
      hidden.push(hiddenPart);
    }
    if(i == list.length - 1 && end < str.length) {
      visible.push(str.slice(end));
    }
  });

  return { visible, hidden };
}

function getVisibleText(visible) {
  return visible.join("");
}

function getFullText(visible, hidden) {
  return visible.map((s, i) => i & 1 ? hidden[i >> 1] : s).join("");
}
