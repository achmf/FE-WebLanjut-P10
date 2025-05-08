self.onmessage = function (pesan) {
    const pengguna = pesan.data;
    const hasil = pengguna.filter((p) => p.umur > 30).sort((a, b) => a.nama.localeCompare(b.nama));
    self.postMessage(hasil);
  }
  