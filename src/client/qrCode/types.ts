export const QRErrorCorrectionLevel = ['L', 'M', 'Q', 'H'];

export interface QRCode {
    addData(data: string, mode?: string): void;
    make(): void;
    isDark(row: number, col: number): boolean;
    getModuleCount(): number;
    createTableTag(cellSize?: number, margin?: number): string;

    createSvgTag(
        cellSize?: number,
        margin?: number,
        alt?: string,
        title?: string
    ): string;

    createDataURL(cellSize?: number, margin?: number): string;

    createImgTag(
        cellSize?: number,
        margin?: number,
        alt?: string
    ): string;

    createASCII(cellSize?: number, margin?: number): string;

    renderTo2dContext(
        context: CanvasRenderingContext2D,
        cellSize?: number
    ): void;
}
