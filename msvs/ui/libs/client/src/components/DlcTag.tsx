import './DlcTag.css'

/**
 * A tag to denote DLC
 *
 * @returns The DLC tag
 */
export default function DlcTag({ dlc, height, width }: DlcTagProps) {
  return (
    <div className="dlc-tag-wrapper-outer" style={{ height }}>
      <div className="dlc-tag-wrapper-inner" style={{ width }}>
        <div
          className="dlc-tag"
          title={dlc.name}
          style={{ backgroundImage: `url(${dlc.image})`, height: width, width: height }}
        ></div>
      </div>
    </div>
  )
}

interface DlcTagProps {
  dlc: {
    name: string
    image: string
  }
  height: string
  width: string
}
