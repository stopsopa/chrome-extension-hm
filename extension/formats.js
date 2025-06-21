// // simple lib to convert format

// flat format:
// [
//   {
//     "active": true,
//     "label": "xxx DEV",
//     "name": "Authorization",
//     "urlPattern": "xxx.com",
//     "value": "dev",
//     "valueSource": "dictionary"
//   },
//   {
//     "active": true,
//     "label": "xxx OTE",
//     "name": "Authorization",
//     "urlPattern": "xxx.com",
//     "value": "ote",
//     "valueSource": "dictionary"
//   },
//   ...

// to

// list format:
// [
//   {
//     "active": true,
//     "label": "xxx DEV",
//     "urlPattern": "xxx.com",
//     "headers": {
//       "Authorization": {
//         "value": "dev",
//         "source": "dictionary"
//       }
//     }
//   },
//   {
//     "active": true,
//     "label": "xxx OTE",
//     "urlPattern": "xxx.com",
//     "headers": {
//       "Authorization": {
//         "value": "ote",
//         "source": "dictionary"
//       }
//     }
//   },
//   ...
// and other way around

// when given flat format it should return it without changes
// but when 'value' doesn't exist is thould look for first element in
export function toFlat(list) {
  return list.map((d, i) => {
    const n = {
      active: d.active || true,
      label: d.label,
      urlPattern: d.urlPattern,

      value: d.value,
      name: d.name,
      valueSource: d.valueSource,
    };

    if (typeof d.label !== "string") {
      throw new Error("Label must be a string - object index: " + i);
    }

    if (typeof d.name !== "string") {
      let firstKey = "Authorization";

      if (!d?.headers?.[firstKey]) {
        firstKey = Object.keys(d?.headers || {})[0];
      }

      if (typeof firstKey !== "string") {
        throw new Error("headers object have to have at least one key - object index: " + i);
      }

      n.name = firstKey;

      if (typeof n.value !== "string") {
        n.value = d?.headers?.[firstKey]?.value;
      }

      if (typeof n.valueSource !== "string") {
        n.valueSource = d?.headers?.[firstKey]?.source;
      }
    }

    return n;
  });
}

export function toList(list) {
  const newList = list.map((d, i) => {
    const n = {
      active: d.active || true,
      label: d.label,
      urlPattern: d.urlPattern,
      headers: isObject(d.headers) ? d.headers : {},
    };

    if (Object.keys(n.headers).length === 0) {
      if (typeof d.name !== "string") {
        throw new Error("toList name must be a string - object index: " + i);
      }

      if (typeof d.value !== "string") {
        throw new Error("toList value must be a string - object index: " + i);
      }

      if (typeof d.valueSource !== "string") {
        throw new Error("toList valueSource must be a string - object index: " + i);
      }

      n.headers[d.name] = {
        value: d.value,
        source: d.valueSource,
      };
    }

    return n;
  });

  return newList;
}

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
