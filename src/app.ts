import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';
import morgan from 'morgan';
import logger, { stream } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors({
    origin: config.env === 'development'
        ? '*'
        : [config.app.url],
    credentials: true,
}));

app.use(morgan('combined', { stream }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

app.use('/api', apiRateLimiter);

app.use('/api', routes);

app.use('/uploads', express.static(config.upload.dir));

app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
    });
});

app.use(errorHandler);

const startServer = async () => {
    try {
        app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} in ${config.env} mode`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
