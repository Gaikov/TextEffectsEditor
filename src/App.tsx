import { useEffect, useState } from 'react';
import CanvasSizeInputs from './components/CanvasSizeInputs';
import FontCanvas from './components/FontCanvas';
import FontProperties from './components/FontProperties';
import { getCuratedFonts, loadSystemFonts } from './fonts';
import styles from './App.module.css';

export default function App() {
  const [fontList, setFontList] = useState<string[]>(getCuratedFonts);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const systemFonts = await loadSystemFonts();
        if (!cancelled) {
          setFontList(systemFonts);
          setFontsLoaded(true);
        }
      } catch {
        if (!cancelled) setFontsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.root}>
      <CanvasSizeInputs />
      <div className={styles.body}>
        <FontCanvas />
        <FontProperties fontList={fontList} fontsLoaded={fontsLoaded} />
      </div>
    </div>
  );
}
