// src/service/contactService.ts
import { getRepository } from "typeorm";
import { Contact, LinkPrecedence } from "../entity/Contact";
import { Request, Response, NextFunction } from "express";

class ContactController {

  public async createOrUpdateContact(
    request: Request,
    response: Response,
    next: NextFunction
  ) {

    try {
    const { email, phoneNumber } = request.body;

    const contactRepository = getRepository(Contact)

    const existingContact = await contactRepository.findOne({
        where: {
          phoneNumber: phoneNumber,
          email : email
        },
      });
      
    if(existingContact){
        if(existingContact.linkPrecedence == LinkPrecedence.PRIMARY){

            const secondaryContact = await contactRepository.find({
                where: {
                  linkedId : existingContact.id,
                  linkPrecedence : LinkPrecedence.SECONDARY
                },
              });

              const secondaryIds: Array<number> = [];
              const secondaryemails: Array<string> = [];
              const secondaryphoneNumbers: Array<string> = [];

              secondaryContact.forEach((contact) => {
                if(existingContact.email != contact.email){
                    secondaryemails.push(contact.email)
                }
                if(existingContact.phoneNumber != contact.phoneNumber){
                    secondaryphoneNumbers.push(contact.phoneNumber)
                }
                secondaryIds.push(contact.id)
              });


              const Result = {
                contact: {
                  primaryContactId: existingContact.id,
                  emails: [existingContact.email].concat(secondaryemails),
                  phoneNumbers: [existingContact.phoneNumber].concat(secondaryphoneNumbers),
                  secondaryContactIds: secondaryIds,
                },
              };
              
              response.status(200).json(Result);


        }else{

            const primaryContact = await contactRepository.findOne({
                where: {
                  id : existingContact.linkedId,
                  linkPrecedence : LinkPrecedence.PRIMARY
                },
              });

            

            if(primaryContact){
                const emails : Array<string> = [primaryContact.email]
                const phoneNumbers : Array<string> = [primaryContact.phoneNumber]
                if(primaryContact.email != existingContact.email){
                    emails.push(existingContact.email)
                }
                if(primaryContact.phoneNumber != existingContact.phoneNumber){
                    phoneNumbers.push(existingContact.phoneNumber)
                }
                const Result = {
                    contact: {
                      primaryContactId: primaryContact.id,
                      emails: emails,
                      phoneNumbers: phoneNumbers,
                      secondaryContactIds: [existingContact.id],
                    },
                  };
                  
                  response.status(200).json(Result);
            }

        }
        
    }


    const existingContactsByPhoneNumber = await contactRepository.find({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    const existingContactsByMailId = await contactRepository.find({
        where: {
          email: email,
        },
      });

    if(existingContactsByPhoneNumber.length != 0 && existingContactsByMailId.length != 0){
        const primaryContactByPhoneNumber = existingContactsByPhoneNumber.find(contact => {
            contact.linkPrecedence == LinkPrecedence.PRIMARY
        })

        const primaryContactByEmailId = existingContactsByMailId.find(contact => {
            contact.linkPrecedence == LinkPrecedence.PRIMARY
        })

        if(primaryContactByPhoneNumber && primaryContactByEmailId){
          if(primaryContactByPhoneNumber.id < primaryContactByEmailId.id) {
            primaryContactByEmailId.linkPrecedence = LinkPrecedence.SECONDARY
            primaryContactByEmailId.linkedId = primaryContactByPhoneNumber.id
            const newContactEmail = await contactRepository.save(primaryContactByEmailId);
            if(newContactEmail){
                await contactRepository.update({
                    linkedId : primaryContactByEmailId.id,
                    linkPrecedence : LinkPrecedence.SECONDARY
                },{
                    linkedId : primaryContactByPhoneNumber.id
                })

                const Result = {
                    contact: {
                      primaryContactId: primaryContactByPhoneNumber.id,
                      emails: [primaryContactByPhoneNumber.email,primaryContactByEmailId.email],
                      phoneNumbers: [primaryContactByPhoneNumber.phoneNumber,primaryContactByEmailId.phoneNumber],
                      secondaryContactIds: [primaryContactByEmailId.id],
                    },
                  };
                  response.status(200).json(Result);

            }
          }else{
            primaryContactByPhoneNumber.linkPrecedence = LinkPrecedence.SECONDARY
            primaryContactByPhoneNumber.linkedId = primaryContactByEmailId.id
            const newContactPhoneNumber = await contactRepository.save(primaryContactByPhoneNumber);

            if(newContactPhoneNumber){
                await contactRepository.update({
                    linkedId : primaryContactByPhoneNumber.id,
                    linkPrecedence : LinkPrecedence.SECONDARY
                },{
                    linkedId : primaryContactByEmailId.id
                })

                const Result = {
                    contact: {
                      primaryContactId: primaryContactByEmailId.id,
                      emails: [primaryContactByEmailId.email,primaryContactByPhoneNumber.email],
                      phoneNumbers: [primaryContactByEmailId.phoneNumber,primaryContactByPhoneNumber.phoneNumber],
                      secondaryContactIds: [primaryContactByPhoneNumber.id],
                    },
                  };
                  response.status(200).json(Result);

            }
          }
        }

    }

    if (existingContactsByPhoneNumber.length === 0) {

      if (existingContactsByMailId.length === 0) {
        const Contact = contactRepository.create({
            phoneNumber : phoneNumber,
            email : email,
            linkPrecedence : LinkPrecedence.PRIMARY
        })

        const newContact = await contactRepository.save(Contact);

        const Result = {
            contact: {
              primaryContactId: newContact.id,
              emails: [newContact.email],
              phoneNumbers: [newContact.phoneNumber],
              secondaryContactIds: [],
            },
          };
          response.status(200).json(Result);

      }else{

        let primaryContact!: Contact;
        let phoneNumberExist: boolean = false;
        const secondaryIds: Array<number> = [];
        const secondaryphoneNumbers: Array<string> = [];
  
        existingContactsByMailId.forEach((contact) => {
          if (contact.linkPrecedence == LinkPrecedence.PRIMARY) {
            primaryContact = contact;
          } else {
            secondaryIds.push(contact.id);
            secondaryphoneNumbers.push(contact.phoneNumber);
          }
        });
    
            const Contact = contactRepository.create({
              phoneNumber,
              email,
              linkedId: primaryContact.id,
              linkPrecedence: LinkPrecedence.SECONDARY,
            });
            const newContact = await contactRepository.save(Contact);
    
            const Result = {
              contact: {
                primaryContactId: primaryContact.id,
                emails: [primaryContact.email],
                phoneNumbers: [primaryContact.phoneNumber].concat(secondaryphoneNumbers).concat(newContact.phoneNumber),
                secondaryContactIds: secondaryIds.concat(newContact.id),
              },
            };
            response.status(200).json(Result);

      }
    } else {
      let primaryContact!: Contact;
      let emailExist: boolean = false;
      const secondaryIds: Array<number> = [];
      const secondaryemails: Array<string> = [];
      let secondaryContactLinkedId!: number;

      existingContactsByPhoneNumber.forEach((contact) => {
        if (contact.linkPrecedence == LinkPrecedence.PRIMARY) {
          primaryContact = contact;
        } else {
          secondaryIds.push(contact.id);
          secondaryemails.push(contact.email);
          secondaryContactLinkedId = contact.linkedId
        }
        if (contact.email == email) {
          emailExist = true;
        }
      });

      if (primaryContact && emailExist) {

        const Result = {
          contact: {
            primaryContactId: primaryContact.id,
            emails: [primaryContact.email].concat(secondaryemails),
            phoneNumbers: [primaryContact.phoneNumber],
            secondaryContactIds: secondaryIds,
          },
        };
        response.status(200).json(Result);

      } else if (!emailExist && !primaryContact) {

        const Contact = contactRepository.create({
          phoneNumber,
          email,
          linkPrecedence: LinkPrecedence.PRIMARY,
        });
        const newContact = await contactRepository.save(Contact);

        const Result = {
          contact: {
            primaryContactId: newContact.id,
            emails: [newContact.email],
            phoneNumbers: [newContact.phoneNumber],
            secondaryContactIds: [],
          },
        };
        response.status(200).json(Result);
      }
    }
  } catch(error) {
    console.log(error)
     response.status(500).json({error : error});
  }
} 
}

export default new ContactController();
