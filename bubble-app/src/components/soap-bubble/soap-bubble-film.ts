/*!
ReactDrops Component License 1.0

Copyright (c) 2026 ReactDrops

1. Scope and definitions

This license applies to ReactDrops software and associated documentation that
expressly carry this license or are distributed under a LICENSE file containing
it (the "Software"). "Licensor" means the copyright holder granting rights in
the Software, and only to the extent that holder has authority to grant them.
"You" means the individual or entity exercising these rights.

An "End Product" is a website, application, service, or other finished project
whose primary purpose is something other than providing reusable components,
source code, templates, or development assets to others.

2. Permitted uses

Subject to this license, Licensor grants You a worldwide, non-exclusive,
royalty-free license to use, copy, modify, and incorporate the Software into
unlimited personal, internal, and commercial End Products. You may charge for
End Products, subscriptions, development services, and work for clients.

You may distribute the Software as an integrated part of an End Product,
including in browser-delivered JavaScript. You may provide End Product source
code to a client, and share the Software with employees and contractors who
need it to develop or maintain End Products. Those recipients may use the
Software for those purposes subject to this license. This permission does not
authorize them to redistribute the Software as a reusable development asset.

3. Restricted redistribution

Unless You obtain separate written permission from Licensor, You may not sell,
sublicense, publish, share, or otherwise redistribute the Software, or a
substantial portion of it, whether unchanged or modified:

(a) as a standalone component, component library, UI kit, source-code bundle,
    registry, or other collection of reusable development assets;
(b) as part of a theme, template, starter project, or similar product offered
    to multiple recipients for reuse in their own projects; or
(c) through a builder or generation service that offers the Software as
    reusable blocks or source-code exports for others' projects.

These restrictions apply to paid and free redistribution. Renaming, restyling,
repackaging, translating, or modifying the Software does not remove them.
Building separate finished websites or applications for multiple clients is
permitted; offering a reusable template or kit containing the Software is not.

Public source-code hosting by Licensor is not permission to republish the
Software under another license. This license does not override any separate
rights granted directly by Licensor or applicable code-hosting terms.

4. Notices and ownership

Retain this license and applicable copyright and third-party notices in source
copies of the Software and permitted source distributions. No visible credit
or ReactDrops logo is required in an End Product's user interface.

Licensor retains ownership of its Software. You retain rights in Your own
contributions, subject to the license for any incorporated Software. No rights
to trademarks, trade names, or logos are granted by this license.

5. Third-party materials and separate grants

Dependencies, fonts, images, videos, and other third-party materials remain
subject to their respective licenses. Separately identified third-party code
is licensed under its stated terms, and these restrictions do not limit rights
granted by its copyright holders. Retain all required third-party notices.
Demo media are not licensed by this document; obtain Your own permission or
replace them with media You are entitled to use.

This license does not revoke rights granted under other valid licenses. It does
not assert ownership of third-party work or grant rights Licensor lacks.

6. Termination

The permissions granted here continue unless terminated for a material breach.
If You fail to cure a material breach within 30 days after receiving written
notice from Licensor, Your permissions terminate. On termination, cease uses
and distributions requiring this license. Rights under independently granted
licenses and rights that applicable law does not allow to be restricted remain
unaffected. Sections 3 through 7 survive termination.

7. Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. TO THE MAXIMUM EXTENT
PERMITTED BY APPLICABLE LAW, LICENSOR AND CONTRIBUTORS SHALL NOT BE LIABLE FOR
ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT, OR OTHERWISE,
ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR ITS USE.

This license does not limit rights or exceptions that applicable law makes
non-waivable. No other permissions are granted by implication.
*/

export const soapBubbleSpectralSamples = 16;
/** Thickest film in the lookup table, in nanometres. */
export const soapBubbleFilmMax = 3000;
/** Lookup table size: thickness samples by incidence samples. */
export const soapBubbleFilmSize = [768, 48] as const;

// CIE 1931 2° colour matching functions, multi-lobe fit by Wyman, Sloan and
// Shirley (2013).
function cie(lambda: number) {
  const lobe = (center: number, below: number, above: number) => {
    const t = (lambda - center) * (lambda < center ? below : above);
    return Math.exp(-0.5 * t * t);
  };
  return [
    0.362 * lobe(442, 0.0624, 0.0374) +
      1.056 * lobe(599.8, 0.0264, 0.0323) -
      0.065 * lobe(501.1, 0.049, 0.0382),
    0.821 * lobe(568.8, 0.0213, 0.0247) + 0.286 * lobe(530.9, 0.0613, 0.0322),
    1.217 * lobe(437, 0.0845, 0.0278) + 0.681 * lobe(459, 0.0385, 0.0725),
  ];
}

// Per-sample weights that turn a reflectance spectrum into linear sRGB. Each
// channel is normalised so a flat spectrum stays neutral under the light.
function spectralWeights() {
  const count = soapBubbleSpectralSamples;
  const start = 385;
  const end = 715;
  const step = (end - start) / count;
  const lambda = new Float32Array(count);
  const bandwidth = new Float32Array(count);
  const weights = new Float32Array(count * 3);
  const sum = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const l = start + (i + 0.5) * step;
    const [x, y, z] = cie(l);
    const rgb = [
      3.2406 * x - 1.5372 * y - 0.4986 * z,
      -0.9689 * x + 1.8758 * y + 0.0415 * z,
      0.0557 * x - 0.204 * y + 1.057 * z,
    ];
    lambda[i] = l;
    bandwidth[i] = step / l;
    for (let c = 0; c < 3; c++) {
      weights[i * 3 + c] = rgb[c];
      sum[c] += rgb[c];
    }
  }
  for (let i = 0; i < count; i++) for (let c = 0; c < 3; c++) weights[i * 3 + c] /= sum[c];
  return { lambda, bandwidth, weights };
}

const WATER = 1.333;

// Two-beam Airy reflectance of a symmetric air–water–air film for one
// polarisation; c is the bandwidth-averaged cosine of the phase difference.
const airy = (r2: number, c: number) => (2 * r2 * (1 - c)) / (1 + r2 * r2 - 2 * r2 * c);

/**
 * Interference reflectance of the film in linear sRGB over thickness and the
 * cosine of incidence: 16 wavelengths and both polarisations per entry,
 * averaged over each wavelength band so thick films wash out to white.
 */
export function soapBubbleFilmTable() {
  const { lambda, bandwidth, weights } = spectralWeights();
  const [columns, rows] = soapBubbleFilmSize;
  const count = lambda.length;
  const table = new Float32Array(columns * rows * 4);
  // Phase and band spread grow linearly with thickness, so along a row each
  // wavelength's cosine and sine are stepped by a rotation instead of being
  // evaluated: two trigonometric pairs per wavelength and row, not per entry.
  const cosPhase = new Float64Array(count);
  const sinPhase = new Float64Array(count);
  const stepCos = new Float64Array(count);
  const stepSin = new Float64Array(count);
  const spreadCos = new Float64Array(count);
  const spreadSin = new Float64Array(count);
  const spreadStepCos = new Float64Array(count);
  const spreadStepSin = new Float64Array(count);
  const spreadStep = new Float64Array(count);
  for (let row = 0; row < rows; row++) {
    const cosI = Math.max(1e-4, row / (rows - 1));
    const sin2 = 1 - cosI * cosI;
    const cosT = Math.sqrt(Math.max(0, 1 - sin2 / (WATER * WATER)));
    const rs = (cosI - WATER * cosT) / (cosI + WATER * cosT);
    const rp = (WATER * cosI - cosT) / (WATER * cosI + cosT);
    const rs2 = rs * rs;
    const rp2 = rp * rp;
    // Optical path difference between the two reflected beams per column, in nm.
    const pathStep = (4 * Math.PI * WATER * soapBubbleFilmMax * cosT) / (columns - 1);
    for (let i = 0; i < count; i++) {
      const phase = pathStep / lambda[i];
      const spread = 0.5 * phase * bandwidth[i];
      cosPhase[i] = 1;
      sinPhase[i] = 0;
      stepCos[i] = Math.cos(phase);
      stepSin[i] = Math.sin(phase);
      spreadCos[i] = 1;
      spreadSin[i] = 0;
      spreadStepCos[i] = Math.cos(spread);
      spreadStepSin[i] = Math.sin(spread);
      spreadStep[i] = spread;
    }
    let index = row * columns * 4;
    for (let column = 0; column < columns; column++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let i = 0; i < count; i++) {
        const spread = column * spreadStep[i];
        const sinc = spread < 1e-3 ? 1 : spreadSin[i] / spread;
        const c = cosPhase[i] * sinc;
        const reflectance = 0.5 * (airy(rs2, c) + airy(rp2, c));
        r += reflectance * weights[i * 3];
        g += reflectance * weights[i * 3 + 1];
        b += reflectance * weights[i * 3 + 2];
        // On to the next column.
        const phaseCos = cosPhase[i];
        cosPhase[i] = phaseCos * stepCos[i] - sinPhase[i] * stepSin[i];
        sinPhase[i] = sinPhase[i] * stepCos[i] + phaseCos * stepSin[i];
        const bandCos = spreadCos[i];
        spreadCos[i] = bandCos * spreadStepCos[i] - spreadSin[i] * spreadStepSin[i];
        spreadSin[i] = spreadSin[i] * spreadStepCos[i] + bandCos * spreadStepSin[i];
      }
      table[index++] = Math.max(0, r);
      table[index++] = Math.max(0, g);
      table[index++] = Math.max(0, b);
      table[index++] = 1;
    }
  }
  return table;
}
