export const toDoListHtml = () => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    .item-level-1 {
      padding-left: 10px;
    }

    .item-level-2 {
      padding-left: 30px;
    }

    div {
      user-select: none;
    }
    input {
      display: block;
      border: none;
    }
  </style>
</head>

<body>
  <div id="to-do-container">
  </div>
  <script>
    const data = [{
        content: 'item1',
        children: [{
          content: 'item1 - 1'
        }],
      },
      {
        content: 'item2',
        children: [{
          content: 'item2 - 1'
        }],
      },
      {
        content: 'item3',
        children: [{
          content: 'item3 - 1'
        }],
      },
    ];
    const toDoContainer = document.querySelector('#to-do-container');
    document.oncontextmenu = (e) => {
      console.log(e)
      e.preventDefault();
    };
    const refresh = () => {
      toDoContainer.innerHTML = '';
      console.log(toDoContainer.children);
      data.forEach((level1, index1) => {
        const input1 = document.createElement('input');
        input1.value = level1.content;
        input1.onchange = (e) => {
          data[index1].content = e.target.value || 'X';
          refresh();
        }
        const div1 = document.createElement('div');
        div1.append(input1);
        div1.classList.add('item-level-1');
        div1.ondblclick = () => {

        }

        div1.onmousedown = (e) => {
          if (e.button == 2) {
            data.splice(index1, 1);
            console.log(data);
            refresh();
          }
          // } else if (e.button == 0) {
          //   alert("你点了左键");
          // } else if (e.button == 1) {
          //   alert("你点了滚轮");
          // }
        }
        toDoContainer.append(div1);
        level1.children.forEach((level2, index2) => {
          const input2 = document.createElement('input');
          input2.value = level2.content;
          input2.classList.add('item-level-2');
          input2.onchange = (e) => {
            data[index1].children[index2].content = e.target.value || 'X';
            refresh();
          }
          input2.ondblclick = () => {
          }
          input2.oncontextmenu = (e) => {
            e.preventDefault();
          };

          input2.onmousedown = (e) => {
            e.stopPropagation();
            if (e.button == 2) {
              data[index1].children.splice(index2, 1);
              console.log(data);
              refresh();
            }
            // } else if (e.button == 0) {
            //   alert("你点了左键");
            // } else if (e.button == 1) {
            //   alert("你点了滚轮");
            // }
          }
          div1.append(input2);
        });
      });
    }
    refresh();
  </script>
</body>

</html>
`;