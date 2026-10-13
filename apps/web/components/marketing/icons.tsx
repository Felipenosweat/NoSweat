import type { SVGProps } from "react";

// Ícones de traço (estilo Heroicons outline), desenhados inline para não adicionar dependência.

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SparklesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9.8 15.9 9 18.75l-.8-2.85a4.5 4.5 0 0 0-3.1-3.1L2.25 12l2.85-.8a4.5 4.5 0 0 0 3.1-3.1L9 5.25l.8 2.85a4.5 4.5 0 0 0 3.1 3.1l2.85.8-2.85.8a4.5 4.5 0 0 0-3.1 3.1ZM18.26 8.72 18 9.75l-.26-1.03a3.38 3.38 0 0 0-2.46-2.46L14.25 6l1.03-.26a3.38 3.38 0 0 0 2.46-2.46L18 2.25l.26 1.03a3.38 3.38 0 0 0 2.46 2.46l1.03.26-1.03.26a3.38 3.38 0 0 0-2.46 2.46Z" />
  </Icon>
);

export const PhoneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
  </Icon>
);

export const GlobeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 3.75-5.5 3.75-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3M3.6 9h16.8M3.6 15h16.8" />
  </Icon>
);

export const ChatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8.625 9.75h6.75m-6.75 3h4.5M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.555-.337A5.97 5.97 0 0 1 5.41 20.97a5.97 5.97 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </Icon>
);

export const PencilIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </Icon>
);

export const BoltIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon strokeWidth={2.5} {...props}>
    <path d="m4.5 12.75 6 6 9-13.5" />
  </Icon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Icon strokeWidth={2} {...props}>
    <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon strokeWidth={2} {...props}>
    <path d="M12 4.5v15m7.5-7.5h-15" />
  </Icon>
);
