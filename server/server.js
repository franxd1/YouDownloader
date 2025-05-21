const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/download', async (req, res) => {
    const { url, format, quality } = req.body;

    if (!url || !format) {
        return res.status(400).send('Parâmetros inválidos.');
    }

    const ext = format === 'mp3' ? 'mp3' : 'mp4';
    const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';

    res.setHeader('Content-Disposition', `attachment; filename="video.${ext}"`);
    res.setHeader('Content-Type', contentType);

    const height = parseInt(quality) || 720;

    const args = [
        '-f',
        format === 'mp3'
            ? 'bestaudio'
            : `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
        ...(format === 'mp3' ? ['-x', '--audio-format', 'mp3'] : []),
        '-o',
        '-',
        url
    ];

    try {
        const process = exec(args, { stdio: 'pipe' });

        process.stdout.pipe(res);

        process.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });

        process.on('error', (err) => {
            console.error('Erro ao executar yt-dlp:', err);
            res.status(500).send('Erro ao iniciar download.');
        });

        process.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp finalizou com código ${code}`);
            }
        });
    } catch (error) {
        console.error('Erro inesperado:', error);
        res.status(500).send('Erro no servidor.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
