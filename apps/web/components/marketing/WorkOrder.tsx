import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { WorkOrderTabs, type ShotProps } from "./WorkOrderTabs";
import { WORK_ORDERS } from "./work-orders";

// Assinatura da V4 (docs/design/v4-direction.md): a "Ordem de serviço". A frase do dono à
// esquerda, o site gerado à direita, com pinos numerados ligando cada trecho ao lugar onde ele
// apareceu. Este componente (servidor) prepara as imagens otimizadas e faz o preload só da
// primeira aba, separado por tamanho de tela (o celular não baixa a captura grande).

const DESKTOP_SIZES = "(min-width: 1200px) 720px, (min-width: 768px) 62vw, 100vw";
const PHONE_SIZES = "(min-width: 480px) 300px, 78vw";

export function WorkOrder() {
  const shots: ShotProps[] = WORK_ORDERS.map((order) => {
    const name = order.sentence.find((s) => typeof s !== "string" && s.pin === "name");
    const business = typeof name === "string" || !name ? order.trade : name.text;
    const { props: desktop } = getImageProps({
      src: `/shots/${order.slug}-desktop.webp`,
      alt: `Example website for ${business}, a fictional business, on a computer screen`,
      width: 2560,
      height: 1720,
      sizes: DESKTOP_SIZES,
    });
    const { props: phone } = getImageProps({
      src: `/shots/${order.slug}-phone.webp`,
      alt: `Example website for ${business}, a fictional business, on a phone`,
      width: 780,
      height: 1688,
      sizes: PHONE_SIZES,
    });
    return { desktop, phone };
  });

  const first = shots[0];
  if (first) {
    preload(first.desktop.src, {
      as: "image",
      imageSrcSet: first.desktop.srcSet,
      imageSizes: DESKTOP_SIZES,
      fetchPriority: "high",
      media: "(min-width: 768px)",
    });
    preload(first.phone.src, {
      as: "image",
      imageSrcSet: first.phone.srcSet,
      imageSizes: PHONE_SIZES,
      fetchPriority: "high",
      media: "(max-width: 767.98px)",
    });
  }

  return <WorkOrderTabs orders={WORK_ORDERS} shots={shots} />;
}
