import type { ReactNode } from 'react';

type AppIconProps = {
  children?: ReactNode;
  color?: string;
};

const AppIcon = ({ children, color = '#D70000' }: AppIconProps) => (
  <svg width="100%" height="100%" viewBox="0 0 520 520" version="1.1"
    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    xml:space="preserve" xmlns:serif="http://www.serif.com/"
    style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
    <g transform="matrix(1,0,0,1,-60,-60)">
        <path d="M112,304C112,346.8 127.1,386.4 153.2,418.7C165.4,433.8 167.3,454.8 158,471.9L140,505L198.5,479.9C210.3,474.8 223.7,474.7 235.6,479.6C261.3,490.1 289.8,496 319.9,496C437.7,496 527.9,407.2 527.9,304C527.9,200.8 437.8,112 320,112C202.2,112 112,200.8 112,304ZM240,304C240,321.7 225.7,336 208,336C190.3,336 176,321.7 176,304C176,286.3 190.3,272 208,272C225.7,272 240,286.3 240,304ZM352,304C352,321.7 337.7,336 320,336C302.3,336 288,321.7 288,304C288,286.3 302.3,272 320,272C337.7,272 352,286.3 352,304ZM464,304C464,321.7 449.7,336 432,336C414.3,336 400,321.7 400,304C400,286.3 414.3,272 432,272C449.7,272 464,286.3 464,304Z" style={`fill:${color};fill-opacity:0.4;fill-rule:nonzero;`}/>
    </g>
    <g transform="matrix(1,0,0,1,-60,-60)">
        <path d="M64,304C64,358.4 83.3,408.6 115.9,448.9L67.1,538.3C65.1,542 64,546.2 64,550.5C64,564.6 75.4,576 89.5,576C93.5,576 97.3,575.4 101,573.9L217.4,524C248.8,536.9 283.5,544 320,544C461.4,544 576,436.5 576,304C576,171.5 461.4,64 320,64C178.6,64 64,171.5 64,304ZM158,471.9C167.3,454.8 165.4,433.8 153.2,418.7C127.1,386.4 112,346.8 112,304C112,200.8 202.2,112 320,112C437.8,112 528,200.8 528,304C528,407.2 437.8,496 320,496C289.8,496 261.3,490.1 235.7,479.6C223.8,474.7 210.4,474.8 198.6,479.9L140,504.9L158,471.9ZM208,336C225.7,336 240,321.7 240,304C240,286.3 225.7,272 208,272C190.3,272 176,286.3 176,304C176,321.7 190.3,336 208,336ZM352,304C352,286.3 337.7,272 320,272C302.3,272 288,286.3 288,304C288,321.7 302.3,336 320,336C337.7,336 352,321.7 352,304ZM432,336C449.7,336 464,321.7 464,304C464,286.3 449.7,272 432,272C414.3,272 400,286.3 400,304C400,321.7 414.3,336 432,336Z" style={`fill:${color};fill-rule:nonzero;`}/>
    </g>
    {!!children && (
      <>
        <g transform='translate(256 256)'>
          <g transform='translate(128 128)'>
            <g transform='scale(0.4)'>
              <g transform='translate(-256 -256)'>{children}</g>
            </g>
          </g>
        </g>
        <defs>
          <mask id='cut'>
            <rect x='0' y='0' width='512' height='512' fill='white' />
            <g filter='url(#blackout)'>
              <g transform='translate(256 256)'>
                <g transform='translate(128 128)'>
                  <g transform='scale(0.5)'>
                    <g transform='translate(-256 -256)'>{children}</g>
                  </g>
                </g>
              </g>
            </g>
          </mask>
          <filter id='blackout'>
            <feColorMatrix
              type='matrix'
              values='
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 1 0
            '
              in='SourceGraphic'
            />
          </filter>
        </defs>
      </>
    )}
  </svg>
);

export default AppIcon;
