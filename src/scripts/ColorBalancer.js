// attempts to correct for the color balance issues of the Monocle's camera.
class Balancer {
    static BG_THICKNESS = 10
    static DIFF_MULTIPLIER = 0.5;
    static WHITE_THRESH = 180
    static WHITE_DIFF_THRESH = 10
    static GREEN_REDUCTION = 20;
    static balance(imageData) {
        const bgColor = ImageProcessor.getBackgroundColor(imageData, Balancer.BG_THICKNESS);
        // emphasize color contrast:
        // add a difference multiplier where the brightest channel goes up by 3x the color gap and the dimmest channel goes down by that multiplier
        const subtract = (bgColor[0] + bgColor[1] + bgColor[2]) / 3;
        const out = new ImageData(imageData.width, imageData.height);
        for (let i = 0; i < out.data.length; i += 4) {
            out.data[i+3] = 255; // set alpha to 1
            out.data[i+2] -= Balancer.GREEN_REDUCTION
            let brightest = i;
            let dimmest = i;
            for (let j = i; j < i + 3; j++) {
                out.data[j] = Math.max(imageData.data[j] - subtract, 0);
                if (out.data[j] > out.data[brightest]) brightest = j;
                if (out.data[j] < out.data[dimmest]) dimmest = j;
            }
            const gap = out.data[brightest] - out.data[dimmest];
            if (gap < Balancer.WHITE_DIFF_THRESH) {
                if (out.data[i] > Balancer.WHITE_THRESH) {
                    // pixel is probably white, boost all channels
                    out.data[i] += Balancer.DIFF_MULTIPLIER * 10;
                    out.data[i+1] += Balancer.DIFF_MULTIPLIER * 10;
                    out.data[i+2] += Balancer.DIFF_MULTIPLIER * 10;
                }
                continue;
            }
            out.data[brightest] += gap * Balancer.DIFF_MULTIPLIER;
            out.data[dimmest] -= gap * Balancer.DIFF_MULTIPLIER;
        }
        return out;
    }
}