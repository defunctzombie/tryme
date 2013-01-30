var slicer = Array.prototype.slice;
function throttle(f, delay) {
    var id = 0
    var params = [f, delay].concat(slicer.call(arguments, 2))
    return function throttled() {
        clearTimeout(id, throttled)
        id = setTimeout.apply(this, params.concat(slicer.call(arguments)))
    }
}

var blocks = document.querySelectorAll('.code-block');

for (var i=0 ; i<blocks.length; ++i) {
    var block = blocks[i];
    make_block(i + 1);
}

function make_block(num) {
    var input = document.querySelector('#code-block-' + num);

    var editor = CodeMirror.fromTextArea(input, {
        lineNumbers: true,
        mode: 'javascript',
        autofocus: true,
        theme: 'solarized light'
    });

    var output = document.querySelector('#output-' + num);

    editor.on('change', throttle(function() {
        var src = editor.getValue();

        try {
            var res = eval(src);
        } catch (err) {
            res = err.message;
        }

        output.innerHTML = '';
        if (res instanceof Element) {
            output.appendChild(res);
        }
        else {
            output.textContent = res;
        }
    }, 500));

    editor.setValue(editor.getValue());
    editor.refresh();
}
