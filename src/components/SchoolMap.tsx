import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { SchoolRecord } from '../data/sampleSchools'

type SchoolMapProps = {
  schools: SchoolRecord[]
  onSelectSchool: (school: SchoolRecord) => void
}

const districtCenter: [number, number] = [9.3639, 78.8395]

function markerIcon(color: string) {
  return L.divIcon({
    className: 'school-map-marker',
    html: `<span style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export default function SchoolMap({ schools, onSelectSchool }: SchoolMapProps) {
  const locatedSchools = useMemo(
    () => schools.filter((school) => Number.isFinite(school.latitude) && Number.isFinite(school.longitude)),
    [schools],
  )

  const concentrationById = useMemo(() => {
    const counts = new Map<number, number>()
    locatedSchools.forEach((school) => {
      const nearby = locatedSchools.filter((other) => {
        if (school.id === other.id) return false
        const latitudeDelta = (school.latitude ?? 0) - (other.latitude ?? 0)
        const longitudeDelta = (school.longitude ?? 0) - (other.longitude ?? 0)
        return Math.sqrt(latitudeDelta ** 2 + longitudeDelta ** 2) < 0.08
      }).length
      counts.set(school.id, nearby)
    })
    return counts
  }, [locatedSchools])

  const getColor = (school: SchoolRecord) => {
    const nearby = concentrationById.get(school.id) ?? 0
    if (nearby >= 5) return '#dc2626'
    if (nearby >= 2) return '#f59e0b'
    return '#16a34a'
  }

  return (
    <div className="school-map-wrap">
      <MapContainer center={districtCenter} zoom={9} scrollWheelZoom className="school-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locatedSchools.map((school) => (
          <Marker
            key={school.id}
            position={[school.latitude as number, school.longitude as number]}
            icon={markerIcon(getColor(school))}
            eventHandlers={{ click: () => onSelectSchool(school) }}
          >
            <Popup>
              <strong>{school.schoolName}</strong>
              <br />{school.management} | {school.taluk}
              <br />Students: {school.totalStudents} | Teachers: {school.totalTeachers}
            </Popup>
          </Marker>
        ))}
        {locatedSchools.length === 0 && <CircleMarker center={districtCenter} radius={12} pathOptions={{ color: '#2563eb' }} />}
      </MapContainer>
      <div className="map-legend">
        <span><i className="legend-dot green" /> Normal</span>
        <span><i className="legend-dot orange" /> Medium concentration</span>
        <span><i className="legend-dot red" /> High concentration</span>
      </div>
    </div>
  )
}
