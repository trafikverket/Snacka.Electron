import type { ReactNode } from 'react';

type AppIconProps = {
  children?: ReactNode;
  color?: string;
};

const AppIcon = ({ children, color = '#F5455C' }: AppIconProps) => (
  <svg width='100%' viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'>
    <g transform="matrix(0.953333,0,0,1.2,18.6667,-43)">
        <rect x="100" y="215" width="300" height="55" style="fill:white;"/>
    </g>
    <g transform="matrix(1.22488,0,0,1.22488,-57.5716,-47.8542)">
        <path d="M377.27,46L134.75,46C86.49,46 47.01,85.48 47.01,133.74L47.01,265.25C47.01,313.51 86.49,352.99 134.75,352.99L277.01,352.99L277.01,443.78C277.01,449.09 283.14,452.05 287.3,448.75L431.77,333.99L431.64,333.99C451.93,317.88 465.01,293.02 465.01,265.25L465.01,133.74C465.01,85.48 425.53,46 377.27,46ZM167.42,261.48C155.86,261.48 146.5,252.11 146.5,240.56C146.5,229.01 155.87,219.64 167.42,219.64C178.97,219.64 188.34,229.01 188.34,240.56C188.34,252.11 178.97,261.48 167.42,261.48ZM256,261.48C244.44,261.48 235.08,252.11 235.08,240.56C235.08,229.01 244.45,219.64 256,219.64C267.55,219.64 276.92,229.01 276.92,240.56C276.92,252.11 267.55,261.48 256,261.48ZM344.58,261.48C333.02,261.48 323.66,252.11 323.66,240.56C323.66,229.01 333.03,219.64 344.58,219.64C356.13,219.64 365.5,229.01 365.5,240.56C365.5,252.11 356.13,261.48 344.58,261.48Z" style="fill:{color};fill-rule:nonzero;"/>
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
