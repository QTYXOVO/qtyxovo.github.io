(function () {
  function _(e, t, i) { var a = null; if ("text" === e) return document.createTextNode(t); a = document.createElement(e); for (var n in t) if ("style" === n) for (var o in t.style) a.style[o] = t.style[o]; else if ("className" === n) a.className = t[n]; else if ("event" === n) for (var o in t.event) a.addEventListener(o, t.event[o]); else a.setAttribute(n, t[n]); if (i) if ("string" == typeof i) a.innerHTML = i; else if (Array.isArray(i)) for (var l = 0; l < i.length; l++)null != i[l] && a.appendChild(i[l]); return a; }
  function $(a) { return document.querySelector(a); }
  HTMLElement.prototype.replaceWith = function (n) { this.parentNode.insertBefore(n, this); this.remove(); return n; };

  var statusMsg = $('#status-message'), loadFileInput = $('#load-file'), outputList = $('#output-list');
  var songListForm = $('.input-field.songlist');
  var currentList = {};
  loadFileInput.addEventListener('change', function () {
    tryLoadFile(this.files[0]);
  });
  $('#load-from-text').addEventListener('click', function () {
    var textarea = this.parentNode.parentNode.insertBefore(_('textarea'), this.parentNode.nextSibling);
    textarea.focus();
    textarea.addEventListener('blur', function () {
      tryLoadFile(this.value);
      this.remove();
    })
  })
  function loadTextContent(file) {
    return new Promise(function (res, rej) {
      if (typeof file == 'string') return res(file);
      var reader = new FileReader;
      reader.readAsText(file, 'UTF-8');
      reader.onload = function () {
        res(this.result);
      };
      reader.onerror = function (e) {
        rej(e);
      };
    });
  }
  function parseTextContent(text) {
    try {
      return JSON.parse(text);
    } catch (e) { }
    try {
      return JSON.parse('[' + text + ']');
    } catch (e) { }
    try {
      return eval('[' + text + ']');
    } catch (e) { }
    throw new Error('无法解析文件内容');
  }
  function processJson(json) {
    console.log(json);
    if (json.difficulties) json = [json];
    if (json.songs) json = json.songs;
    if (Array.isArray(json)) {
      json.forEach(function (i) {
        if (i.difficulties !== undefined) {
          i.difficulties.sort(function (a, b) { return a.ratingClass - b.ratingClass; });
          currentList[i.id] = i;
        }
      });
    }
  }
  // var diffiMap = ['?', 1, 2, 3, 4, 5, 6, 7, 8, 9, '9+', 10];
  function renderList() {
    while (outputList.childNodes.length) outputList.childNodes[0].remove();
    Object.values(currentList).forEach(function (i) {
      var summary = _('summary', {}, [
        _('span', { style: { color: '#555' } }, [_('text', i.id)])
      ]), details = outputList.appendChild(_('details', { 'data-id': i.id }, [
        summary,
        _('table', {}, [_('tbody', {}, [
          _('tr', {}, [_('td', {}, [_('text', 'id：')]), _('td', {}, [_('text', i.id)])]),
          _('tr', {}, [_('td', {}, [_('text', '曲名：')]), _('td', {}, [_('text', i.title_localized.en)])]),
          _('tr', {}, [_('td', {}, [_('text', '曲师：')]), _('td', {}, [_('text', i.artist)])]),
          _('tr', {}, [_('td', {}, [_('text', '显示bpm：')]), _('td', {}, [_('text', i.bpm)])]),
          _('tr', {}, [_('td', {}, [_('text', '基准bpm：')]), _('td', {}, [_('text', i.bpm_base)])]),
          _('tr', {}, [_('td', {}, [_('text', '曲包id：')]), _('td', {}, [_('text', i.set)])]),
          _('tr', {}, [_('td', {}, [_('text', '音频预览开始/ms：')]), _('td', {}, [_('text', i.audioPreview)])]),
          _('tr', {}, [_('td', {}, [_('text', '音频预览结束/ms：')]), _('td', {}, [_('text', i.audioPreviewEnd)])]),

          /* 比较难绷的 - 'text'后面缺了个逗号导致下面这行之前出bug了 */
          _('tr', {}, [_('td', {}, [_('text', '歌曲侧：')]), _('td', {}, [_('text', ['光芒(光)', '纷争(对立)', '消色', 'Lephon'][parseInt(i.side)])])]),
          _('tr', {}, [_('td', {}, [_('text', '背景：')]), _('td', {}, [_('text', i.bg)])]),
          _('tr', {}, [_('td', {}, [_('text', '日期:')]), _('td', {}, [_('text', i.date)])]),
          _('tr', {}, [_('td', {}, [_('text', '版本:')]), _('td', {}, [_('text', i.version)])]),
        ])])
      ])); // outputList.appendChild
      i.difficulties.forEach(function (i) {
        summary.appendChild(_('span', { className: 'difficulty chart-' + i.ratingClass }, [_('text', i.rating + (i.ratingPlus ? "+" : ""))]));
        details.appendChild(_('table', {}, [_('tbody', {}, [
          _('tr', {}, [_('td', {}, [_('span', { className: 'difficulty chart-' + i.ratingClass }, [_('text', ['PST', 'PRS', 'FTR', 'BYD'][i.ratingClass])])]), _('td')]),
          _('tr', {}, [_('td', {}, [_('text', '谱师：')]), _('td', {}, [_('text', i.chartDesigner)])]),
          _('tr', {}, [_('td', {}, [_('text', '封面画师：')]), _('td', {}, [_('text', i.jacketDesigner)])]),
          _('tr', {}, [_('td', {}, [_('text', '难度：')]), _('td', {}, [_('text', i.rating)])]),
          _('tr', {}, [_('td', {}, [_('text', '+：')]), _('td', {}, [_('text', i.ratingPlus ? "true" : "false")])])
        ])]));
      }); // difficulties.forEach
      summary.appendChild(_('br'));
      summary.appendChild(_('text', '　' + [i.title_localized.en, i.artist].join(' - ')));
      details.appendChild(_('div', {}, [
        _('input', { type: 'button', value: '编辑', event: { click: editThisSong } }),
        _('input', { type: 'button', value: '删除', event: { click: deleteThisSong } })
      ]));
    }); // currentList.forEach
  }

  function tryLoadFile(file) {
    loadTextContent(file)
      .then(parseTextContent)
      .then(processJson)
      .then(renderList)
      .catch(function (e) {
        console.error(e);
        alert(e);
      });
  }
  [document.body.parentElement].forEach(function (i) {
    i.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
    });
    i.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var file = e.dataTransfer.files[0];
      tryLoadFile(file);
    });
  });

  function editThisSong() {
    var id = this.parentNode.parentNode.dataset.id, data = currentList[id];
    songListForm['enable-0'].checked = false; // Past PST
    songListForm['enable-1'].checked = false; // Present PRS
    songListForm['enable-2'].checked = false; // Future FTR
    songListForm['enable-3'].checked = false; // Beyond BYD
    songListForm['enable-4'].checked = false; // Eternal ETR
    songListForm['info-id'].value = data.id;
    songListForm['info-title'].value = data.title_localized.en;
    songListForm['info-artist'].value = data.artist;
    songListForm['info-bpm'].value = data.bpm;
    songListForm['info-bpm_base'].value = data.bpm_base;
    songListForm['info-set'].value = data.set;
    songListForm['info-audioPreview'].value = data.audioPreview;
    songListForm['info-audioPreviewEnd'].value = data.audioPreviewEnd;
    songListForm['info-side'].value = data.side;
    songListForm['info-bg'].value = data.bg;
    songListForm['info-date'].value = data.date;
    songListForm['info-version'].value = data.version;
    data.difficulties.forEach(function (i) {
      songListForm['enable-' + i.ratingClass].checked = true;
      songListForm['charter-' + i.ratingClass].value = i.chartDesigner;
      songListForm['jacket-' + i.ratingClass].value = i.jacketDesigner;
      songListForm['rating-' + i.ratingClass].value = i.rating;
      songListForm['ratingPlus-' + i.ratingClass].value = i.ratingPlus ? 1 : 0;
    });
  }
  function deleteThisSong() {
    var id = this.parentNode.parentNode.dataset.id, data = currentList[id];
    if (confirm('确认删除 ' + id + '？\n歌名：' + data.title_localized.en + '\n曲师：' + data.artist)) {
      delete currentList[id];
      renderList();
    }
  }

  songListForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    data.id = songListForm['info-id'].value;
    data.title_localized = {};
    data.title_localized.en = songListForm['info-title'].value;
    data.artist = songListForm['info-artist'].value;
    data.bpm = songListForm['info-bpm'].value;
    data.bpm_base = songListForm['info-bpm_base'].value | 0;
    data.set = songListForm['info-set'].value;
    data.purchase = ''
    data.audioPreview = songListForm['info-audioPreview'].value | 0;
    data.audioPreviewEnd = songListForm['info-audioPreviewEnd'].value | 0;
    data.side = songListForm['info-side'].value | 0;
    data.bg = songListForm['info-bg'].value;
    data.version = songListForm['info-version'].value;
    data.date = (songListForm['info-date'].value | 0) || Math.floor(Date.now() / 1000);
    data.difficulties = [];
    for (var i = 0; i < 5; i++) {
      if (songListForm['enable-' + i].checked) {
        data.difficulties.push({
          ratingClass: i,
          chartDesigner: songListForm['charter-' + i].value,
          jacketDesigner: songListForm['jacket-' + i].value,
          rating: songListForm['rating-' + i].value | 0,
          ratingPlus: Boolean(parseInt(songListForm['ratingPlus-' + i].value))
        });
      }
    }

    currentList[data.id] = data;
    renderList();
  });
  $('#clear-list').addEventListener('click', function () {
    if (confirm('确认清空列表？')) {
      currentList = {};
      renderList();
    }
  });
  $('#save-file').addEventListener('click', function () {
    // if (!currentList["tempestissimo"])
    //    currentList["tempestissimo"] = JSON.parse('{"id": "tempestissimo","title_localized": {"en": "Tempestissimo"},"artist": "","bpm": "","bpm_base": 114514,"set": "base","purchase": "","audioPreview": 1919,"audioPreviewEnd": 810,"side": 0,"date": 0,"version": "sh*t placeholder","difficulties": []}');
    var vals = Object.values(currentList);
    if (!vals.length) return;
    var str = JSON.stringify({ songs: vals }, null, '  ');
    var blob = new Blob([str], { mimeType: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.body.appendChild(_('a', {
      href: url,
      download: 'songlist',
      target: '_blank'
    }));
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  $('#copy-content').addEventListener('click', function () {
    // if (!currentList["tempestissimo"])
    //    currentList["tempestissimo"] = JSON.parse('{"id": "tempestissimo","title_localized": {"en": "Tempestissimo"},"artist": "","bpm": "","bpm_base": 114514,"set": "base","purchase": "","audioPreview": 1919,"audioPreviewEnd": 810,"side": 0,"date": 0,"version": "sh*t placeholder","difficulties": []}');
    var vals = Object.values(currentList);
    if (!vals.length) return;
    var str = JSON.stringify({ songs: vals }, null, '  ');
    var textarea = this.parentNode.parentNode.insertBefore(_('textarea'), this.parentNode.nextSibling);
    textarea.value = str;
    textarea.select(0, str.length);
    var success = document.execCommand('copy');
    alert(success ? '已复制' : '复制失败');
    if (success) {
      textarea.remove();
    } else {
      textarea.focus();
      textarea.addEventListener('blur', function () {
        this.remove();
      });
    }
  });
})();