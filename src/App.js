import React, { useState, useEffect, useCallback } from 'react';
import DaftarPengguna from './components/DaftarPengguna';

const App = () => {
  const [pengguna, setPengguna] = useState([]);
  const [memuat, setMemuat] = useState(false);
  const [metode, setMetode] = useState("all");
  const [waktuAll, setWaktuAll] = useState(localStorage.getItem('waktuAll') || null);  // Load from localStorage
  const [waktuAllSettled, setWaktuAllSettled] = useState(localStorage.getItem('waktuAllSettled') || null);  // Load from localStorage
  const [waktuWorker, setWaktuWorker] = useState(localStorage.getItem('waktuWorker') || null);  // Load from localStorage

  const ambilPengguna = useCallback(async () => {
    setMemuat(true);
    const cache = localStorage.getItem('penggunaCache');
    const cacheTimestamp = localStorage.getItem('cacheTimestamp');
    const currentTime = new Date().getTime();
    const cacheExpired = currentTime - cacheTimestamp > 300000; // 5 minutes

    if (cache && !cacheExpired) {
      setPengguna(JSON.parse(cache));
      setMemuat(false);
      return;
    }

    const startAll = performance.now();
    try {
      const pages = [1, 2, 3];
      const requests = pages.map(page => 
        fetch(`http://localhost:3000/api/pengguna?jumlah=50&page=${page}`).then(res => res.json())
      );

      // Parallel fetching with Promise.all
      if (metode === 'all') {
        const data = await Promise.all(requests);
        const mergedData = [].concat(...data);
        const endAll = performance.now();
        const waktu = (endAll - startAll).toFixed(2);
        setWaktuAll(waktu);
        localStorage.setItem('waktuAll', waktu);  // Save to localStorage

        localStorage.setItem('penggunaCache', JSON.stringify(mergedData));
        localStorage.setItem('cacheTimestamp', currentTime.toString());
        setPengguna(mergedData);
        setMemuat(false);
      } else if (metode === 'allSettled') {
        const results = await Promise.allSettled(requests);
        const mergedData = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        const endAllSettled = performance.now();
        const waktu = (endAllSettled - startAll).toFixed(2);
        setWaktuAllSettled(waktu);
        localStorage.setItem('waktuAllSettled', waktu);  // Save to localStorage

        localStorage.setItem('penggunaCache', JSON.stringify(mergedData));
        localStorage.setItem('cacheTimestamp', currentTime.toString());
        setPengguna(mergedData);
        setMemuat(false);
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err);
      setMemuat(false);
    }
  }, [metode]);

  const ambilDataDenganWorker = async () => {
    setMemuat(true);
    const cache = localStorage.getItem('penggunaCache');
    if (cache) {
      setPengguna(JSON.parse(cache));
      setMemuat(false);
      return;
    }
    const pekerja = new Worker('worker.js');
    pekerja.postMessage(pengguna);
    const startWorker = performance.now();
    pekerja.onmessage = (e) => {
      const endWorker = performance.now();
      const waktu = (endWorker - startWorker).toFixed(2);
      setWaktuWorker(waktu);
      localStorage.setItem('waktuWorker', waktu);  // Save to localStorage

      localStorage.setItem('penggunaCache', JSON.stringify(e.data));
      setPengguna(e.data);
      setMemuat(false);
    };
  };

  useEffect(() => {
    ambilPengguna();
  }, [metode, ambilPengguna]);

  // Refresh Data function
  const refreshData = () => {
    localStorage.removeItem('penggunaCache');
    localStorage.removeItem('cacheTimestamp');
    ambilPengguna();  // Re-fetch data and reset state
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Eksplorasi Pengguna (Umur {'>'} 30)</h1>
      {memuat ? <p>Sedang memuat...</p> : <DaftarPengguna pengguna={pengguna} />}
      <div>
        <button onClick={() => setMetode("all")}>Gunakan Promise.all</button>
        <button onClick={() => setMetode("allSettled")}>Gunakan Promise.allSettled</button>
        <button onClick={ambilDataDenganWorker}>Gunakan Web Worker</button>
        <button onClick={refreshData}>Segarkan Data</button>  {/* Refresh Button */}
      </div>
      <p>Waktu Promise.all: {waktuAll} ms</p>
      <p>Waktu Promise.allSettled: {waktuAllSettled} ms</p>
      <p>Waktu Web Worker: {waktuWorker} ms</p>
    </div>
  );
};

export default App;
