import AppIcon from './AppIcon';
import Badge from './Badge';

type MacOSTrayIconProps = {
  notification?: boolean;
};

const MacOSTrayIcon = ({ notification }: MacOSTrayIconProps) => (
  <svg
    width='100%'
    viewBox='0 0 520 520'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <g transform='translate(256, 256) scale(0.8) translate(-256, -256)'>
      <AppIcon color='#D70000'>
        {notification && <Badge value={0} backgroundColor='#D70000' />}
      </AppIcon>
    </g>
  </svg>
);

export default MacOSTrayIcon;
