/*! Eretek Online Araçlar #67 — CSR Okuyucu */
ERT.def('67', {
	run: function (v, c) {
		var A = ERT.asn1, b, x;
		try { b = A.pem(v.pem); } catch (e) { throw c.fe('pem', 'b64'); }
		var msgs = [];
		if (b.some(function (q) { return /PRIVATE KEY/.test(q.label); })) { msgs.push(['err', c.t('priv')]); }
		b = b.filter(function (q) { return /CERTIFICATE REQUEST/.test(q.label); });
		if (!b.length) { throw c.fe('pem', /BEGIN CERTIFICATE-----/.test(v.pem) ? 'isCert' : 'noCsr'); }
		try { x = A.csr(b[0].der); } catch (e) { throw c.fe('pem', 'parse'); }
		var cn = (x.subject.filter(function (p) { return p[0] === 'CN'; })[0] || [])[1] || '';
		var dns = x.san.filter(function (s) { return s.indexOf('DNS:') === 0; }).map(function (s) { return s.slice(4).toLowerCase(); });
		if (!x.san.length) { msgs.push(['warn', c.t('noSan')]); } else if (cn && dns.indexOf(cn.toLowerCase()) === -1 && !/^\d+\.\d+\.\d+\.\d+$/.test(cn)) { msgs.push(['warn', c.t('cnNotSan', { c: cn })]); }
		if (x.key.algo === 'RSA' && x.key.bits < 2048) { msgs.push(['err', c.t('weakKey', { b: x.key.bits })]); }
		if (/sha1|md5/i.test(x.sigAlg)) { msgs.push(['err', c.t('weakSig', { a: x.sigAlg })]); }
		var C = (x.subject.filter(function (p) { return p[0] === 'C'; })[0] || [])[1];
		if (C && !/^[A-Z]{2}$/.test(C)) { msgs.push(['err', c.t('badC', { c: C })]); }
		if (dns.some(function (d) { return /\.local$|\.lan$|\.internal$/.test(d); })) { msgs.push(['warn', c.t('internal')]); }
		var match = null;
		if (v.host) { match = A.matchHost(v.host, x.san, cn); msgs.unshift(match ? ['ok', c.t('hostOk', { h: v.host })] : ['err', c.t('hostNo', { h: v.host })]); }
		if (!msgs.some(function (m) { return m[0] === 'err' || m[0] === 'warn'; })) { msgs.push(['ok', c.t('ok')]); }
		msgs.push(['info', c.t('local')]);
		var kv = [[c.t('subject'), A.nameStr(x.subject)], ['CN', cn || '–'], ['SAN', x.san.join(', ') || '–'], [c.t('key'), x.key.algo + (x.key.bits ? ' ' + x.key.bits + ' bit' : '') + (x.key.curve ? ' (' + x.key.curve + ')' : '')], [c.t('sig'), x.sigAlg], ['EKU', x.eku.join(', ') || '–']];
		return { big: cn || A.nameStr(x.subject), kv: kv, msgs: msgs, x: { copy: kv.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') }, v: { cn: cn, san: x.san, algo: x.key.algo, bits: x.key.bits, match: match } };
	}
});
