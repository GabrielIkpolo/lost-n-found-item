import React from 'react';
import Sidebar from '../components/Sidebar';
import './helpPage.css'; // We'll create this CSS next

const HelpPage = () => {
  return (
    <div className='main-container'>
      <Sidebar />
      
      <div className="help-container">
        <h1>Help & Support</h1>
        
        <section className="help-section">
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-item">
            <h3>How do I claim an item?</h3>
            <p>If you see an item that belongs to you in the "Found Items" list, click "View Details" and then the "Claim Item" button. The finder will be notified via email to arrange a handover.</p>
          </div>

          <div className="faq-item">
            <h3>I lost an item, what should I do?</h3>
            <p>Navigate to "Report Item" and select "Lost". Fill in the details and upload an image if you have one. If someone finds it, they can match it against your report.</p>
          </div>

          <div className="faq-item">
            <h3>Is my contact info safe?</h3>
            <p>Yes. Your phone number and email are hidden from the public. They are only shared with the specific person claiming your item (or the person whose item you claimed) to facilitate the return.</p>
          </div>
        </section>

        <section className="help-section contact-box">
          <h2>Contact Us</h2>
          <p>Need further assistance? Reach out to the Student Affairs unit.</p>
          
          <div className="contact-details">
            <p><i className="fas fa-envelope"></i> <strong>Email:</strong> <a href="mailto:support@adelekeuniversity.edu.ng">To be provided</a></p>
            <p><i className="fas fa-phone"></i> <strong>Security Hotline:</strong> 080-123-4567</p>
            <p><i className="fas fa-map-marker-alt"></i> <strong>Location:</strong> New Horizons ICT Center.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;