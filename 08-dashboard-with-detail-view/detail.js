setTimeout(() => {
  const elem = document.getElementById("detail-iframe");
  const { width, height } =
    elem.parentElement.parentElement.getBoundingClientRect();
  elem.setAttribute("width", width - 8);
  elem.setAttribute("height", height - 8);
}, 100);

Object.defineProperty(window, "detailUrl", {
  set: function (v) {
    // this is run every time detailUrl is assigned a value:
    // the value being assigned can be found in v
    document.getElementById("detail-iframe").setAttribute("src", v);
  },
});
