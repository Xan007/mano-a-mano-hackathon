"""Build the app's CC0 effects. Requires Python, numpy and ffmpeg on PATH."""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.request
import zipfile
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / '.validation' / 'audio-downloads'
OUT = ROOT / 'public' / 'audio'
PACKS = {
    'interface': ('https://kenney.nl/assets/interface-sounds', 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip'),
    'rpg': ('https://kenney.nl/assets/rpg-audio', 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip'),
    'jingles': ('https://kenney.nl/assets/music-jingles', 'https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip'),
}
SOUNDS = [
    ('click', 'interface', 'Audio/click_001.ogg'),
    ('page', 'rpg', 'Audio/bookFlip3.ogg'),
    ('search', 'interface', 'Audio/question_001.ogg'),
    ('message', 'interface', 'Audio/pluck_001.ogg'),
    ('success', 'interface', 'Audio/confirmation_002.ogg'),
    ('error', 'interface', 'Audio/error_001.ogg'),
    ('coin', 'jingles', 'Audio/Pizzicato jingles/jingles_PIZZI05.ogg'),
    ('common', 'jingles', 'Audio/Pizzicato jingles/jingles_PIZZI00.ogg'),
    ('rare', 'jingles', 'Audio/Pizzicato jingles/jingles_PIZZI01.ogg'),
    ('epic', 'jingles', 'Audio/Pizzicato jingles/jingles_PIZZI02.ogg'),
    ('legendary', 'jingles', 'Audio/Pizzicato jingles/jingles_PIZZI03.ogg'),
]

def download(url, path):
    if not path.exists():
        with urllib.request.urlopen(url, timeout=45) as response:
            path.write_bytes(response.read())
    return path

def run(args, data=None):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', *args], input=data, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace'))
    return result.stdout

def encode(name, source, trim=None):
    inputs = ['-i', str(source)]
    if trim: inputs += ['-ss', str(trim[0]), '-t', str(trim[1])]
    raw = run([*inputs, '-af', 'highpass=f=70,lowpass=f=11000,acompressor=threshold=0.12:ratio=3:attack=2:release=30', '-ac', '1', '-ar', '44100', '-f', 'f32le', '-'])
    samples = np.frombuffer(raw, dtype='<f4').copy()
    # Remove padding while retaining a short natural attack and tail.
    audible = np.flatnonzero(np.abs(samples) > max(float(np.max(np.abs(samples))) * 0.002, 0.00005))
    if not len(audible): raise RuntimeError(f'Silent sound: {name}')
    samples = samples[max(0, int(audible[0]) - 220):min(len(samples), int(audible[-1]) + 1103)]
    rms = float(np.sqrt(np.mean(samples ** 2)))
    peak = float(np.max(np.abs(samples)))
    samples *= min(0.10 / max(rms, 0.00001), 0.55 / max(peak, 0.00001))
    fade_in = min(220, len(samples) // 4)
    fade_out = min(1103, len(samples) // 4)
    samples[:fade_in] *= np.linspace(0, 1, fade_in)
    samples[-fade_out:] *= np.linspace(1, 0, fade_out)
    target = OUT / f'{name}.mp3'
    run(['-f', 'f32le', '-ar', '44100', '-ac', '1', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', '-y', str(target)], samples.astype('<f4').tobytes())
    decoded = np.frombuffer(run(['-i', str(target), '-ac', '1', '-ar', '44100', '-f', 'f32le', '-']), dtype='<f4')
    assert np.isfinite(decoded).all() and float(np.max(np.abs(decoded))) < 0.90, name
    return dict(file=target.name, seconds=round(len(decoded)/44100, 3), bytes=target.stat().st_size, peakDb=round(20*np.log10(float(np.max(np.abs(decoded)))), 1), sha256=hashlib.sha256(target.read_bytes()).hexdigest())

CACHE.mkdir(parents=True, exist_ok=True)
(OUT / 'licenses').mkdir(parents=True, exist_ok=True)
archives = {}
for pack, (_, url) in PACKS.items():
    archives[pack] = zipfile.ZipFile(download(url, CACHE / f'{pack}.zip'))
    license_text = archives[pack].read('License.txt').decode('utf-8-sig').replace('\r\r\n','\n').replace('\r\n','\n')
    if 'CC0' not in license_text: raise RuntimeError(f'Unexpected license: {pack}')
    (OUT / 'licenses' / f'kenney-{pack}.txt').write_text(license_text, encoding='utf-8')

manifest = []
for name, pack, member in SOUNDS:
    source = CACHE / f'{pack}-{Path(member).name}'
    source.write_bytes(archives[pack].read(member))
    manifest.append({**encode(name, source), 'author': 'Kenney', 'license': 'CC0-1.0', 'source': PACKS[pack][0], 'originalFile': member})

whoosh_url = 'https://cdn.freesound.org/previews/393/393943_3159560-hq.mp3'
whoosh = download(whoosh_url, CACHE / 'whoosh-jsbarrett.mp3')
manifest.append({**encode('departure', whoosh, (1.49, 0.32)), 'author': 'jsbarrett', 'license': 'CC0-1.0', 'source': 'https://freesound.org/people/jsbarrett/sounds/393943/', 'originalFile': whoosh_url, 'cropStartSeconds': 1.49})
(OUT / 'licenses' / 'whoosh-jsbarrett.txt').write_text('Whoosh — jsbarrett\nhttps://freesound.org/people/jsbarrett/sounds/393943/\nCreative Commons Zero (CC0 1.0)\nhttps://creativecommons.org/publicdomain/zero/1.0/\nSource: publicly available high-quality preview; one take cropped and normalized.\n', encoding='utf-8')
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sounds': len(manifest), 'totalBytes': sum(item['bytes'] for item in manifest), 'durations': {item['file']: item['seconds'] for item in manifest}}))
