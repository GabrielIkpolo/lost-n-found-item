// import React from 'react';
// import "./footer.css"; // Import the CSS file for styling
// import footerLogo from '../assets/images/logo-1.png';

// const Footer = () => {


//   let date = new Date().getFullYear();


//   return (
//     <footer className="footer">
//       <div className="footer-main">
//         {/* Logo and Contact Information */}
//         <div className="footer-logo-contact">
//           <div className="footer-logo">
//             <img src={footerLogo} alt="Adeleke University Logo" />
//           </div>
//           <div className="footer-address">
//             <p>
//               <p>Logun-Ogberin Road, Ede, Osun State</p>

//               <p>
//                 09069631925, 07026115005, 07032387431,<br />
//                 09039372372, 07039401187, 07039103732<br />
//               </p>

//               <p>admissions@adelekeuniversity.edu.ng<br />
//                 registrar@adelekeuniversity.edu.ng
//               </p>

//             </p>
//           </div>
//         </div>

//         {/* Helpful Links */}
//         <div className="footer-links">
//           <h3>HELPFUL LINK</h3>
//           <ul>
//             <li><a href="#">Undergraduate Programme</a></li>
//             <li><a href="#">Scholarship</a></li>
//             <li><a href="#">Campus and Facilities</a></li>
//             <li><a href="#">Faculties</a></li>
//             <li><a href="#">Library</a></li>
//             <li><a href="#">Visiting Us</a></li>
//           </ul>
//         </div>

//         {/* Quick Links */}
//         <div className="footer-links">
//           <h3>QUICK LINK</h3>
//           <ul>
//             <li><a href="#">Admission Portal</a></li>
//             <li><a href="#">Student Portal</a></li>
//             <li><a href="#">Postgraduate programme</a></li>
//             <li><a href="#">Events</a></li>
//             <li><a href="#">News</a></li>
//           </ul>
//         </div>
//       </div>

//       {/* Footer Bottom Section */}
//       <div className="footer-bottom">
//         <div className="footer-copyright">
//           <p>ADELEKE UNIVERSITY | {date} ALL RIGHTS RESERVED</p>
//         </div>
//         <div className="footer-social-icons">
//           <a href="#" className="social-icon"><i className="fab fa-facebook"></i></a>
//           <a href="#" className="social-icon"><i className="fab fa-x"></i></a>
//           <a href="#" className="social-icon"><i className="fab fa-linkedin"></i></a>
//           <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
//           <a href="#" className="social-icon"><i className="fab fa-youtube"></i></a>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;


import React from 'react';
import "./footer.css"; // Import the CSS file for styling
import footerLogo from '../assets/images/logo-1.png';

const Footer = () => {
  let date = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-main">
        {/* Logo and Contact Information */}
        <div className="footer-logo-contact">
          <div className="footer-logo">
            <img src={footerLogo} alt="Adeleke University Logo" />
          </div>
          <div className="footer-address">
            <p>
              <span className="icon-container">
                <i className="fas fa-map-marker-alt"></i> Logun-Ogberin Road, Ede, Osun State
              </span>
            </p>
            <p>
              <span className="icon-container">
                <i className="fas fa-phone"></i> 
                09069631925, 07026115005, 07032387431,<br />
                09039372372, 07039401187, 07039103732
              </span>
            </p>
            <p>
              <span className="icon-container">
                <i className="fas fa-envelope"></i>
                admissions@adelekeuniversity.edu.ng <br />
                registrar@adelekeuniversity.edu.ng
              </span>
            </p>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="footer-links">
          <h3>HELPFUL LINK</h3>
          <ul>
            <li><a href="#">Undergraduate Programme</a></li>
            <li><a href="#">Scholarship</a></li>
            <li><a href="#">Campus and Facilities</a></li>
            <li><a href="#">Faculties</a></li>
            <li><a href="#">Library</a></li>
            <li><a href="#">Visiting Us</a></li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h3>QUICK LINK</h3>
          <ul>
            <li><a href="#">Admission Portal</a></li>
            <li><a href="#">Student Portal</a></li>
            <li><a href="#">Postgraduate programme</a></li>
            <li><a href="#">Events</a></li>
            <li><a href="#">News</a></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Section */}
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>ADELEKE UNIVERSITY | {date} ALL RIGHTS RESERVED</p>
        </div>
        <div className="footer-social-icons">
          <a href="#" className="social-icon"><i className="fab fa-facebook"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-x"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-linkedin"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-youtube"></i></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;