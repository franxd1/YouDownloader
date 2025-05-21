const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/download', (req, res) => {
    const { url, format, quality } = req.body;
    if (!url || !format) return res.status(400).send('Parâmetros inválidos.');

    const ext = format === 'mp3' ? 'mp3' : 'mp4';
    const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
    res.setHeader('Content-Disposition', `attachment; filename="video.${ext}"`);
    res.setHeader('Content-Type', contentType);

    let args;
    if (format === 'mp3') {
        args = ['-f', 'bestaudio', '-x', '--audio-format', 'mp3', '-o', '-', url];
    } else {
        const height = parseInt(quality) || 720;
        args = [
            '-f',
            `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
            '-o', '-',
            url
        ];
    }

    const ytdlp = spawn('yt-dlp', args);

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on('data', (data) => {
        console.error(`yt-dlp erro: ${data}`);
    });

    ytdlp.on('error', (err) => {
        console.error('Erro ao executar yt-dlp:', err);
        res.status(500).send('Erro ao iniciar download.');
    });

    ytdlp.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp saiu com código ${code}`);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
