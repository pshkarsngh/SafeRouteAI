import "./About.css";

export default function About() {
  return (
    <section id="about">
      <div className="about-container">
        <p className="about-eyebrow">About Us</p>

        <h1 className="about-title">
          Navora, la créativité
          qui génère l'étincelle
        </h1>

        <div className="about-body">
          <p>
            Navora est un studio de création qui conçoit des expériences
            digitales inspirantes. Nous combinons design, technologie et
            innovation pour donner vie à des projets qui marquent.
          </p>

          <p>
            Depuis nos débuts, nous accompagnons les marques dans leur
            transformation numérique avec une approche audacieuse et
            personnalisée.
          </p>
        </div>
      </div>
    </section>
  );
}
