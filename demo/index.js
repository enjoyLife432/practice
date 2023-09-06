const data = [
  {
    city: "浙江",
    children: [
      {
        city: "宁波",
        children: [
          {
            city: "蓟州区",
            children: [],
          },
          {
            city: "江北区",
            children: [],
          },
        ],
      },
      {
        city: "杭州",
        children: [
          {
            city: "富阳",
            children: [],
          },
          {
            city: "上城区",
            children: [],
          },
        ],
      },
    ],
  },
  {
    city: "上海",
    children: [
      {
        city: "黄浦区",
        children: [],
      },
    ],
  },
];

// function mapTree(nodes, parents = "") {
//   return nodes.map((item) => {
//     return item.children?.length
//       ? mapTree(item.children, parents ? parents + "," + item.city : item.city)
//       : parents
//       ? parents + "," + item.city
//       : item.city;
//   });
// }
// console.log(mapTree(data));
function flatTree(nodes, parents = []) {
  return nodes.flatMap(({ city, children }) => {
    console.log([...parents, city], "flatMap");
    return children?.length
      ? flatTree(children, [...parents, city])
      : [[...parents, city]];
  });
}

console.log(flatTree(data));
console.log(flatTree(data).map((path) => path.join(",")));
