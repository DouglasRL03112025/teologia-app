/* ════ AGENDA INTERATIVA ════ */

// mês exibido na agenda (objeto Date no dia 1)
window._agendaMes = null;

function agendaMudarMes(delta) {
  if (!window._agendaMes) window._agendaMes = new Date(hj().getFullYear(), hj().getMonth(), 1);
  window._agendaMes = new Date(window._agendaMes.getFullYear(), window._agendaMes.getMonth() + delta, 1);
  window._diaSelecionado = null;
  renderAlunoAgenda();
}

async function getAulasMes(mes, ano) {
  const ini = `${ano}-${String(mes).padStart(2,'0')}-01`;
  const dim = new Date(ano, mes, 0).getDate();
  const fim = `${ano}-${String(mes).padStart(2,'0')}-${String(dim).padStart(2,'0')}`;
  const { data, error } = await supabaseClient
    .from('aulas')
    .select('*')
    .gte('data', ini)
    .lte('data', fim)
    .order('data', { ascending: true });
  if (error) { console.error('[getAulasMes] Erro:', error); return []; }
  return data || [];
}

async function renderAlunoAgenda(){
  if (!usuAtual || !usuAtual.id) return;

  // mês corrente
  const hoje = hj();
  if (!window._agendaMes) window._agendaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const h = window._agendaMes;
  const mes = h.getMonth() + 1;
  const ano = h.getFullYear();

  // ── PRESENÇA: fonte única ──
  const lista = await getPresencaAluno(usuAtual.id);
  const presencas  = lista.filter(r => r.presente === true).length;
  const faltas     = lista.filter(r => r.presente === false).length;
  const percPres   = presencas + faltas > 0 ? Math.round(presencas / (presencas + faltas) * 100) : 0;
  const corPres    = percPres >= 75 ? 'var(--vd)' : percPres >= 50 ? 'var(--am, #f59e0b)' : 'var(--vm)';

  // mapa data → presente
  const presencasPorData = {};
  lista.forEach(r => { presencasPorData[r.data] = r.presente; });

  // ── AULAS FUTURAS DO MÊS ──
  const aulasDoMes = await getAulasMes(mes, ano);
  const aulasPorData = {};
  aulasDoMes.forEach(a => { aulasPorData[a.data] = a; });

  // ── LIVROS ──
  const totalLivros = 24;
  const livrosRec = window.livroAtualSistema || 0;

  // ── PROVAS ──
  const provas = window.provasAluno || [];
  const provasFeitas = provas.filter(p => p.fez_prova === true).length;
  const totalProvas  = 24;

  // ── DASHBOARD (premium) ──
  const dashEl = document.getElementById('al-agenda-dashboard');
  if (dashEl) dashEl.innerHTML =
    '<style>'
      + '@keyframes _fadeUpSafe{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'
      + '@keyframes _agendaShine{0%,100%{left:-100%}50%{left:100%}}'
      + '.agenda-stat-card{background:#fff;border-radius:18px;padding:18px 12px;box-shadow:0 4px 16px rgba(0,0,0,.07);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s;position:relative;overflow:hidden;border:1.5px solid transparent}'
    + '</style>'

    /* ── Hero topo ── */
    + '<div class="agenda-hero" style="margin-bottom:18px;opacity:0;animation:_fadeUpSafe .4s ease forwards;animation-delay:0s">'
      + '<div style="font-family:\'Lora\',serif;font-size:21px;font-weight:700;color:var(--azul);letter-spacing:-.3px;line-height:1.2">Agenda</div>'
      + '<div style="font-size:13px;color:var(--cin);margin-top:3px;opacity:.6;letter-spacing:.2px">Presenças, aulas e progresso</div>'
    + '</div>'

    /* ── Grid 3 cards stats ── */
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px">'

      /* Livros */
      + '<div class="agenda-stat-card" style="background:linear-gradient(160deg,#f0f6ff,#e8f0fe);border-color:#c7d9f8;opacity:0;animation:_fadeUpSafe .4s ease forwards;animation-delay:.04s"'
        + ' onclick="irAluno(\'livros\')"'
        + ' onmouseover="this.style.transform=\'translateY(-4px) scale(1.02)\';this.style.boxShadow=\'0 12px 28px rgba(26,58,92,.18)\'"'
        + ' onmouseout="this.style.transform=\'translateY(0) scale(1)\';this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.07)\'"'
        + ' onmousedown="this.style.transform=\'scale(0.95)\'"'
        + ' onmouseup="this.style.transform=\'translateY(-4px) scale(1.02)\'">'
        + '<div style="font-size:20px;margin-bottom:5px;line-height:1;opacity:.75">📚</div>'
        + '<div style="font-size:22px;font-weight:800;color:var(--azul);font-family:\'Lora\',serif;line-height:1.1;margin-bottom:3px">' + livrosRec + '<span style="font-size:11px;font-weight:500;color:var(--cin);opacity:.7">/' + totalLivros + '</span></div>'
        + '<div style="font-size:10px;color:var(--cin);font-weight:700;text-transform:uppercase;letter-spacing:.6px;opacity:.6">Livros</div>'
      + '</div>'

      /* Presença */
      + '<div class="agenda-stat-card" style="background:linear-gradient(160deg,#f0fdf5,#dcfce7);border-color:#a7f3c0;opacity:0;animation:_fadeUpSafe .4s ease forwards;animation-delay:.08s"'
        + ' onclick="irAluno(\'presenca\')"'
        + ' onmouseover="this.style.transform=\'translateY(-4px) scale(1.02)\';this.style.boxShadow=\'0 12px 28px rgba(22,163,74,.18)\'"'
        + ' onmouseout="this.style.transform=\'translateY(0) scale(1)\';this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.07)\'"'
        + ' onmousedown="this.style.transform=\'scale(0.95)\'"'
        + ' onmouseup="this.style.transform=\'translateY(-4px) scale(1.02)\'">'
        + '<div style="font-size:20px;margin-bottom:5px;line-height:1;opacity:.75">📊</div>'
        + '<div style="font-size:22px;font-weight:800;font-family:\'Lora\',serif;color:' + corPres + ';line-height:1.1;margin-bottom:3px">' + percPres + '<span style="font-size:11px;font-weight:500;color:var(--cin);opacity:.7">%</span></div>'
        + '<div style="font-size:10px;color:var(--cin);font-weight:700;text-transform:uppercase;letter-spacing:.6px;opacity:.6">Presença</div>'
        + (percPres >= 75
          ? '<div style="font-size:9px;background:#16a34a;color:#fff;border-radius:99px;padding:1px 8px;margin-top:4px;font-weight:700;letter-spacing:.3px">✓ Regular</div>'
          : '<div style="font-size:9px;background:#dc2626;color:#fff;border-radius:99px;padding:1px 8px;margin-top:4px;font-weight:700;letter-spacing:.3px">⚠ Atenção</div>'
        )
      + '</div>'

      /* Provas */
      + '<div class="agenda-stat-card" style="background:linear-gradient(160deg,#fff8f0,#fef3e2);border-color:#fed8a0;opacity:0;animation:_fadeUpSafe .4s ease forwards;animation-delay:.12s"'
        + ' onclick="irAluno(\'notas\')"'
        + ' onmouseover="this.style.transform=\'translateY(-4px) scale(1.02)\';this.style.boxShadow=\'0 12px 28px rgba(180,83,9,.15)\'"'
        + ' onmouseout="this.style.transform=\'translateY(0) scale(1)\';this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.07)\'"'
        + ' onmousedown="this.style.transform=\'scale(0.95)\'"'
        + ' onmouseup="this.style.transform=\'translateY(-4px) scale(1.02)\'">'
        + '<div style="font-size:20px;margin-bottom:5px;line-height:1;opacity:.75">🎓</div>'
        + '<div style="font-size:22px;font-weight:800;color:var(--azul);font-family:\'Lora\',serif;line-height:1.1;margin-bottom:3px">' + provasFeitas + '<span style="font-size:11px;font-weight:500;color:var(--cin);opacity:.7">/' + totalProvas + '</span></div>'
        + '<div style="font-size:10px;color:var(--cin);font-weight:700;text-transform:uppercase;letter-spacing:.6px;opacity:.6">Provas</div>'
      + '</div>'

    + '</div>';

  // ── CALENDÁRIO INTERATIVO ──
  const elCalMes = document.getElementById('al-agenda-cal-mes');
  const elCal    = document.getElementById('al-agenda-cal');
  const elDetalhe = document.getElementById('al-agenda-dia-detalhe');
  if (elCalMes) elCalMes.textContent = M[h.getMonth()] + ' ' + h.getFullYear();
  if (elDetalhe) elDetalhe.innerHTML = '';

  if (elCal) {
    const dim = new Date(ano, mes, 0).getDate();
    const p1  = new Date(ano, mes - 1, 1).getDay();
    const hojeK = hoje.toISOString().slice(0, 10);
    let cal = DS.map(d => `<div class="cd hd">${d}</div>`).join('');
    for (let i = 0; i < p1; i++) cal += '<div class="cd vz"></div>';
    for (let d = 1; d <= dim; d++) {
      const k = `${ano}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const v = presencasPorData[k];
      const temAula = !!aulasPorData[k];
      const isHoje  = k === hojeK;
      let cls = 'cd';
      let inlineStyle = 'cursor:pointer';
      if (v === true)        { cls += ' cp'; }
      else if (v === false)  { cls += ' cf'; }
      else if (isHoje && temAula) { cls += ' cd-hoje-aula'; }
      else if (isHoje)       { cls += ' cd-hoje'; }
      else if (temAula)      { cls += ' cd-aula'; }
      if (window._diaSelecionado === k) { cls += ' cd-selected'; }
      const isEspecial = cls.includes('cp') || cls.includes('cf') || cls.includes('cd-hoje') || cls.includes('cd-aula');
      const hoverScale = isEspecial ? 'scale(1.1)' : 'scale(1.1)';
      cal += `<div class="${cls}" style="${inlineStyle}"`
        + ` onmouseover="if(!this.classList.contains('hd')&&!this.classList.contains('vz')){this.style.transform='scale(1.1)';this.style.boxShadow='0 4px 12px rgba(0,0,0,.15)'}"`
        + ` onmouseout="if(!this.classList.contains('cd-selected')){this.style.transform='';this.style.boxShadow=''}"`
        + ` onmousedown="this.style.transform='scale(0.95)'"`
        + ` onmouseup="this.style.transform='scale(1.1)'"`
        + ` onclick="window._diaSelecionado='${k}';agendaMostrarDia('${k}')">${d}</div>`;
    }

    const mesAtualKey = mes + '-' + ano;
    if (!window._mesAnteriorKey) window._mesAnteriorKey = mesAtualKey;
    let anim = '_slideLeftIn';
    if (window._mesAnteriorKey) {
      const [mAnt, aAnt] = window._mesAnteriorKey.split('-').map(Number);
      if (ano < aAnt || (ano === aAnt && mes < mAnt)) {
        anim = '_slideRightIn';
      }
    }
    window._mesAnteriorKey = mesAtualKey;

    elCal.innerHTML = cal;
    elCal.style.animation = 'none';
    void elCal.offsetWidth;
    elCal.style.animation = anim + ' .25s cubic-bezier(.4,0,.2,1)';
  }

  // ── AULAS FUTURAS DO MÊS (premium) ──
  const hojeStr = hoje.toISOString().slice(0, 10);
  const elFuturas = document.getElementById('al-agenda-futuras');
  if (elFuturas) {
    const futuras = aulasDoMes.filter(a => a.data >= hojeStr);

    /* ── helpers de data ── */
    function _diffDias(dataStr) {
      var d = new Date(dataStr + 'T12:00:00');
      var h = new Date(); h.setHours(0,0,0,0);
      return Math.round((d - h) / 86400000);
    }
    function _fmtDataBR(dataStr) {
      var d = new Date(dataStr + 'T12:00:00');
      return DS[d.getDay()] + ', ' + fmtD(d);
    }

    if (futuras.length === 0) {
      elFuturas.innerHTML =
        '<div style="text-align:center;padding:32px 16px;opacity:0;animation:_fadeUpSafe .4s ease forwards">'
          + '<div style="font-size:36px;margin-bottom:12px;opacity:.4">📅</div>'
          + '<div style="font-size:14px;font-weight:600;color:var(--cin);opacity:.7">Nenhuma aula agendada</div>'
          + '<div style="font-size:12px;color:var(--cin);opacity:.5;margin-top:4px">As próximas aulas aparecerão aqui</div>'
        + '</div>';
    } else {
      var proxima   = futuras[0];
      var diffProx  = _diffDias(proxima.data);
      var isHojeProx = diffProx === 0;
      var badgeProx  = isHojeProx
        ? '<div style="display:inline-block;background:#dc2626;color:#fff;font-size:9px;font-weight:800;padding:2px 10px;border-radius:99px;letter-spacing:.6px;margin-bottom:8px;animation:_acaoPulse 2s ease-in-out infinite">HOJE</div>'
        : '<div style="display:inline-block;background:rgba(255,255,255,.25);color:#fff;font-size:9px;font-weight:700;padding:2px 10px;border-radius:99px;letter-spacing:.5px;margin-bottom:8px">Em ' + diffProx + ' dia' + (diffProx !== 1 ? 's' : '') + '</div>';

      /* ── card principal — próxima aula ── */
      var mainCard =
        '<div class="agenda-main-card" style="'
          + 'background:linear-gradient(135deg,#1a3a5c 0%,#0f2540 100%);'
          + 'border-radius:20px;padding:24px 22px 22px;margin-bottom:20px;'
          + 'box-shadow:0 8px 28px rgba(15,37,64,.32);'
          + 'position:relative;overflow:hidden;cursor:pointer;color:#fff;'
          + 'opacity:0;transform:translateY(10px);'
          + 'animation:_fadeUpSafe .45s cubic-bezier(.4,0,.2,1) forwards;animation-delay:.02s;'
          + 'transition:all .22s cubic-bezier(.4,0,.2,1)"'
          + ' onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 18px 44px rgba(15,37,64,.44)\';this.style.filter=\'brightness(1.07)\'"'
          + ' onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 8px 28px rgba(15,37,64,.32)\';this.style.filter=\'brightness(1)\'"'
          + ' onmousedown="this.style.transform=\'scale(0.96)\'"'
          + ' onmouseup="this.style.transform=\'translateY(-4px)\'">'
          /* decoração de fundo */
          + '<div style="position:absolute;top:-22px;right:-22px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.05)"></div>'
          + '<div style="position:absolute;bottom:-30px;right:28px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,.07)"></div>'
          + '<div style="position:absolute;top:0;left:-60%;width:50%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent);transform:skewX(-20deg);animation:_agendaShine 7s ease-in-out infinite"></div>'
          /* conteúdo */
          + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.5);margin-bottom:10px">📅 Próxima aula</div>'
          + badgeProx
          + '<div style="font-size:20px;font-weight:800;font-family:\'Lora\',serif;line-height:1.25;margin-bottom:8px;letter-spacing:.2px">' + (proxima.descricao || 'Aula programada') + '</div>'
          + '<div style="font-size:13px;font-weight:600;color:rgba(255,255,255,.75);margin-bottom:4px">🗓 ' + _fmtDataBR(proxima.data) + (proxima.hora ? '  ⏰ ' + proxima.hora : '') + '</div>'
          + (proxima.livro ? '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px">📖 ' + proxima.livro + '</div>' : '')
        + '</div>';

      /* ── timeline das demais aulas ── */
      var restantes = futuras.slice(1);
      var timelineHtml = '';
      if (restantes.length > 0) {
        timelineHtml =
          '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--cin);opacity:.6;margin-bottom:14px;opacity:0;animation:_fadeUpSafe .4s ease forwards;animation-delay:.18s">Próximas aulas</div>'
          + '<div class="timeline" style="position:relative;padding-left:28px">'
          /* linha vertical da timeline */
          + '<div style="position:absolute;left:9px;top:8px;bottom:8px;width:2px;background:linear-gradient(to bottom,var(--azul),rgba(26,58,92,.1));border-radius:99px"></div>'
          + restantes.map(function(a, i) {
              var diff    = _diffDias(a.data);
              var isHoje  = diff === 0;
              var isFut   = diff > 0;
              var statusCls = isHoje ? 'hoje' : (isFut ? 'futura' : 'concluida');
              var dotColor  = isHoje ? '#dc2626' : (isFut ? 'var(--azul)' : '#9ca3af');
              var dotBorder = isHoje ? '2px solid #fca5a5' : (isFut ? '2px solid #93c5fd' : '2px solid #e5e7eb');
              var cardBg    = isHoje ? '#fef2f2' : '#fff';
              var cardBrd   = isHoje ? '#fca5a5' : (isFut ? '#e5e7eb' : '#f3f4f6');
              var delay     = (0.2 + i * 0.06).toFixed(2);
              return '<div class="timeline-item timeline-item-' + statusCls + '" style="position:relative;margin-bottom:12px;opacity:0;animation:_fadeUpSafe .4s ease forwards;animation-delay:' + delay + 's">'
                /* bolinha */
                + '<div class="timeline-dot" style="position:absolute;left:-24px;top:14px;width:12px;height:12px;border-radius:50%;background:' + dotColor + ';border:' + dotBorder + ';box-shadow:0 0 0 3px rgba(255,255,255,.9);transition:transform .2s cubic-bezier(.4,0,.2,1)"></div>'
                /* card */
                + '<div class="timeline-card" style="background:' + cardBg + ';border:1.5px solid ' + cardBrd + ';border-radius:14px;padding:13px 16px;box-shadow:0 2px 8px rgba(0,0,0,.06);transition:all .2s cubic-bezier(.4,0,.2,1);cursor:pointer"'
                  + ' onmouseover="this.parentNode.querySelector(\'.timeline-dot\').style.transform=\'scale(1.35)\';this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 20px rgba(0,0,0,.12)\'"'
                  + ' onmouseout="this.parentNode.querySelector(\'.timeline-dot\').style.transform=\'scale(1)\';this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.06)\'"'
                  + ' onmousedown="this.style.transform=\'scale(0.97)\'"'
                  + ' onmouseup="this.style.transform=\'translateY(-2px)\'">'
                  + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
                    + '<div>'
                      + '<div style="font-size:11px;font-weight:700;color:var(--azul);margin-bottom:3px;opacity:.8">🗓 ' + _fmtDataBR(a.data) + (a.hora ? ' · ' + a.hora : '') + '</div>'
                      + '<div style="font-size:13px;font-weight:700;color:#111;line-height:1.35">' + (a.descricao || 'Aula programada') + '</div>'
                      + (a.livro ? '<div style="font-size:11px;color:var(--cin);opacity:.6;margin-top:3px">📖 ' + a.livro + '</div>' : '')
                    + '</div>'
                    + (isHoje
                      ? '<div style="flex-shrink:0;background:#dc2626;color:#fff;font-size:8px;font-weight:800;padding:2px 7px;border-radius:99px;letter-spacing:.4px;white-space:nowrap;margin-top:2px">HOJE</div>'
                      : '<div style="flex-shrink:0;font-size:10px;font-weight:600;color:var(--cin);opacity:.55;white-space:nowrap;margin-top:4px">Em ' + diff + 'd</div>'
                    )
                  + '</div>'
                + '</div>'
              + '</div>';
            }).join('')
          + '</div>';
      }

      elFuturas.innerHTML = mainCard + timelineHtml;
    }
  }

  // al-agenda-lista: vazio — histórico pertence à tela de Presença  // al-agenda-lista: vazio — histórico pertence à tela de Presença
  const listaEl = document.getElementById('al-agenda-lista');
  if (listaEl) listaEl.innerHTML = '';

  // guarda contexto para o clique no dia
  window._agendaPresencasPorData = presencasPorData;
  window._agendaAulasPorData     = aulasPorData;
}

function agendaMostrarDia(k) {
  const elDetalhe = document.getElementById('al-agenda-dia-detalhe');
  if (!elDetalhe) return;
  const pMap = window._agendaPresencasPorData || {};
  const aMap = window._agendaAulasPorData     || {};
  const v = pMap[k];
  const aula = aMap[k];
  const d = new Date(k + 'T12:00:00');
  // Badge de status (Alteração 6)
  let badgeHtml = '';
  if (v === true)        badgeHtml = `<span style="background:#e8f7ee;color:#1f7a4c;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;display:inline-block;margin-top:8px">✅ Presente</span>`;
  else if (v === false)  badgeHtml = `<span style="background:#fdeaea;color:#a83232;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;display:inline-block;margin-top:8px">❌ Falta registrada</span>`;
  else if (aula)         badgeHtml = `<span style="background:#fff8e6;color:#a06c00;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;display:inline-block;margin-top:8px">📅 Aula programada</span>`;
  else                   badgeHtml = `<span style="background:#f2f2f2;color:#666;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;display:inline-block;margin-top:8px">Sem registro</span>`;

  // Conteúdo da aula (Alterações 4 e 5)
  let aulaHtml = '';
  if (aula) {
    aulaHtml += `<div style="font-size:16px;font-weight:800;color:#111;margin-bottom:4px">📖 ${aula.livro || 'Livro'}</div>`;
    if (aula.descricao) aulaHtml += `<div style="font-size:12px;opacity:.6">${aula.descricao}</div>`;
    if (aula.hora)      aulaHtml += `<div style="font-size:12px;opacity:.6">🕐 ${aula.hora}</div>`;
  }

  // Montagem do innerHTML com animação (Alterações 1–7)
  let html = `<style>@keyframes _fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}</style>`;
  html += `<div style="animation:_fadeSlideIn .25s cubic-bezier(.4,0,.2,1) forwards">`;
  html += `<div style="background:#fff;border-radius:18px;padding:18px 20px;box-shadow:0 6px 18px rgba(0,0,0,.08);margin-top:10px;transition:box-shadow .2s,transform .15s;cursor:default"
    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 28px rgba(0,0,0,.14)'"
    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 6px 18px rgba(0,0,0,.08)'"
    onmousedown="this.style.transform='scale(0.97)'"
    onmouseup="this.style.transform='translateY(-2px)'">`;
  html += `<div style="font-size:14px;font-weight:700;color:var(--azul);margin-bottom:6px">📅 ${DS[d.getDay()]}, ${fmtD(d)}</div>`;
  html += aulaHtml;
  html += badgeHtml;
  html += `</div></div>`;
  elDetalhe.innerHTML = html;
}

/* ════ FIM AGENDA INTERATIVA ════ */
